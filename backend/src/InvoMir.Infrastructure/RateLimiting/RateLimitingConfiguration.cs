using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;

namespace InvoMir.Infrastructure.RateLimiting;

public static class RateLimitingConfiguration
{
    private const string AppliedRuleItemKey = "InvoMir.RateLimiting.AppliedRule";
    private const string ForgotPasswordEmailItemKey = "InvoMir.RateLimiting.ForgotPasswordEmail";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IServiceCollection AddInvoMirRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRejectedResponseAsync;

            // Global fallback protects any newly added endpoint until a precise policy is attached.
            // When InvoMir scales to multiple API instances, switch to distributed rate limiting using
            // RedisRateLimiter from the Redis.RateLimiting package, backed by the existing Redis instance.
            // The policy configuration stays identical; only the storage changes.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                if (IsHealthCheck(context))
                    return RateLimitPartition.GetNoLimiter("health-checks");

                var rule = RateLimitRule.GlobalFallback();
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Auth strict limits block brute force, password sprays, reset-token abuse, and signup spam.
            options.AddPolicy(RateLimitPolicies.AuthStrict, context =>
            {
                var rule = RateLimitRule.ForAuthStrict(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Token endpoints are called automatically by clients, so they need more room than password endpoints.
            options.AddPolicy(RateLimitPolicies.AuthToken, context =>
            {
                var rule = RateLimitRule.ForAuthToken(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Authenticated API limits are per user to avoid shared-office IPs punishing unrelated tenants.
            options.AddPolicy(RateLimitPolicies.ApiAuthenticated, context =>
            {
                var rule = RateLimitRule.ForAuthenticatedApi(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Invoice actions generate PDFs, send email, update state, and may call external services.
            options.AddPolicy(RateLimitPolicies.InvoiceActions, context =>
            {
                var rule = RateLimitRule.ForInvoiceActions(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Stripe endpoints are public to Stripe/browser callbacks; signature validation remains primary protection.
            options.AddPolicy(RateLimitPolicies.StripeWebhooks, context =>
            {
                var rule = RateLimitRule.ForStripe(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Public payment and tracking links are unauthenticated and must be protected from scraping.
            options.AddPolicy(RateLimitPolicies.PublicPaymentPages, context =>
            {
                var rule = RateLimitRule.ForPublicPaymentPages(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Billing endpoints can create Stripe sessions or cancel subscriptions, so writes are deliberately tight.
            options.AddPolicy(RateLimitPolicies.Subscriptions, context =>
            {
                var rule = RateLimitRule.ForSubscriptions(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });

            // Admin APIs are low-volume support tools and should not tolerate automation bursts.
            options.AddPolicy(RateLimitPolicies.AdminEndpoints, context =>
            {
                var rule = RateLimitRule.ForAdminEndpoints(context);
                StoreAppliedRule(context, rule);
                var partitionKey = BuildPartitionKey(context, rule);
                return CreatePartition(partitionKey, rule);
            });
        });

        return services;
    }

    public static IApplicationBuilder UseInvoMirRateLimitRequestEnrichment(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            if (IsForgotPasswordRequest(context))
                await StoreForgotPasswordEmailAsync(context);

            await next(context);
        });
    }

    private static RateLimitPartition<string> CreatePartition(string partitionKey, RateLimitRule rule)
    {
        return rule.Algorithm switch
        {
            RateLimitAlgorithm.TokenBucket => RateLimitPartition.GetTokenBucketLimiter(
                partitionKey,
                _ => new TokenBucketRateLimiterOptions
                {
                    AutoReplenishment = true,
                    QueueLimit = 0,
                    ReplenishmentPeriod = rule.Window,
                    TokenLimit = rule.PermitLimit,
                    TokensPerPeriod = rule.PermitLimit
                }),
            RateLimitAlgorithm.SlidingWindow => RateLimitPartition.GetSlidingWindowLimiter(
                partitionKey,
                _ => new SlidingWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    QueueLimit = 0,
                    PermitLimit = rule.PermitLimit,
                    SegmentsPerWindow = 4,
                    Window = rule.Window
                }),
            _ => RateLimitPartition.GetFixedWindowLimiter(
                partitionKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    QueueLimit = 0,
                    PermitLimit = rule.PermitLimit,
                    Window = rule.Window
                })
        };
    }

    private static async ValueTask WriteRejectedResponseAsync(
        OnRejectedContext context,
        CancellationToken cancellationToken)
    {
        var httpContext = context.HttpContext;
        var rule = GetAppliedRule(httpContext) ?? ResolveRule(httpContext);
        var retryAfter = GetRetryAfter(context, rule.Window);
        var retryAfterSeconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
        var resetUnixTime = DateTimeOffset.UtcNow.AddSeconds(retryAfterSeconds).ToUnixTimeSeconds();
        var userId = GetUserId(httpContext);
        var ipAddress = GetIpAddress(httpContext);
        var endpoint = httpContext.GetEndpoint()?.DisplayName ?? httpContext.Request.Path.Value ?? "unknown";

        var logger = httpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("InvoMir.RateLimiting");

        logger.LogWarning(
            "Rate limit rejected request. IP: {IpAddress}, Endpoint: {Endpoint}, Policy: {PolicyName}, UserId: {UserId}.",
            ipAddress,
            endpoint,
            rule.PolicyName,
            userId);

        httpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        httpContext.Response.ContentType = "application/json";
        httpContext.Response.Headers.RetryAfter = retryAfterSeconds.ToString(CultureInfo.InvariantCulture);
        httpContext.Response.Headers["X-RateLimit-Limit"] = rule.PermitLimit.ToString(CultureInfo.InvariantCulture);
        httpContext.Response.Headers["X-RateLimit-Remaining"] = "0";
        httpContext.Response.Headers["X-RateLimit-Reset"] = resetUnixTime.ToString(CultureInfo.InvariantCulture);

        var response = new RateLimitErrorResponse(
            Success: false,
            Data: null,
            Message: "Rate limit exceeded.",
            Errors: [$"Too many requests. Please wait {retryAfterSeconds} seconds before trying again."]);

        await JsonSerializer.SerializeAsync(
            httpContext.Response.Body,
            response,
            JsonOptions,
            cancellationToken);
    }

    private static TimeSpan GetRetryAfter(OnRejectedContext context, TimeSpan fallback)
    {
        return context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
            ? retryAfter
            : fallback;
    }

    private static RateLimitRule ResolveRule(HttpContext context)
    {
        var policyName = context.GetEndpoint()
            ?.Metadata
            .GetOrderedMetadata<EnableRateLimitingAttribute>()
            .LastOrDefault()
            ?.PolicyName;

        return policyName switch
        {
            RateLimitPolicies.AuthStrict => RateLimitRule.ForAuthStrict(context),
            RateLimitPolicies.AuthToken => RateLimitRule.ForAuthToken(context),
            RateLimitPolicies.ApiAuthenticated => RateLimitRule.ForAuthenticatedApi(context),
            RateLimitPolicies.InvoiceActions => RateLimitRule.ForInvoiceActions(context),
            RateLimitPolicies.StripeWebhooks => RateLimitRule.ForStripe(context),
            RateLimitPolicies.PublicPaymentPages => RateLimitRule.ForPublicPaymentPages(context),
            RateLimitPolicies.Subscriptions => RateLimitRule.ForSubscriptions(context),
            RateLimitPolicies.AdminEndpoints => RateLimitRule.ForAdminEndpoints(context),
            _ => RateLimitRule.GlobalFallback()
        };
    }

    private static void StoreAppliedRule(HttpContext context, RateLimitRule rule)
    {
        context.Items[AppliedRuleItemKey] = rule;
    }

    private static RateLimitRule? GetAppliedRule(HttpContext context)
    {
        return context.Items.TryGetValue(AppliedRuleItemKey, out var value) && value is RateLimitRule rule
            ? rule
            : null;
    }

    private static string BuildPartitionKey(HttpContext context, RateLimitRule rule)
    {
        var identity = rule.KeyKind switch
        {
            RateLimitKeyKind.AuthenticatedUser => GetUserId(context) ?? GetIpAddress(context),
            RateLimitKeyKind.ForgotPasswordEmailAndIp => $"{GetForgotPasswordEmail(context)}:{GetIpAddress(context)}",
            _ => GetIpAddress(context)
        };

        return $"{rule.PolicyName}:{rule.RouteKey}:{identity}";
    }

    private static string? GetUserId(HttpContext context)
    {
        return context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            context.User.FindFirst("sub")?.Value;
    }

    private static string GetIpAddress(HttpContext context)
    {
        return FirstHeaderValue(context.Request, "CF-Connecting-IP") ??
            FirstHeaderValue(context.Request, "X-Forwarded-For") ??
            FirstForwardedAddress(context.Request) ??
            FirstHeaderValue(context.Request, "X-Real-IP") ??
            context.Connection.RemoteIpAddress?.ToString() ??
            "unknown";
    }

    private static string? FirstHeaderValue(HttpRequest request, string headerName)
    {
        var value = request.Headers[headerName].ToString();
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
    }

    private static string? FirstForwardedAddress(HttpRequest request)
    {
        var forwarded = FirstHeaderValue(request, "Forwarded");
        if (string.IsNullOrWhiteSpace(forwarded))
            return null;

        const string key = "for=";
        var forPart = forwarded
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(part => part.StartsWith(key, StringComparison.OrdinalIgnoreCase));

        return forPart?[key.Length..].Trim('"', '[', ']');
    }

    private static string GetForgotPasswordEmail(HttpContext context)
    {
        return context.Items.TryGetValue(ForgotPasswordEmailItemKey, out var value) &&
            value is string email &&
            !string.IsNullOrWhiteSpace(email)
            ? email
            : "unknown-email";
    }

    private static bool IsHealthCheck(HttpContext context)
    {
        return context.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsForgotPasswordRequest(HttpContext context)
    {
        return HttpMethods.IsPost(context.Request.Method) &&
            context.Request.Path.Equals("/api/auth/forgot-password", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task StoreForgotPasswordEmailAsync(HttpContext context)
    {
        if (context.Request.ContentLength is null or 0)
            return;

        context.Request.EnableBuffering();

        using var reader = new StreamReader(
            context.Request.Body,
            Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false,
            leaveOpen: true);

        var body = await reader.ReadToEndAsync(context.RequestAborted);
        context.Request.Body.Position = 0;

        if (string.IsNullOrWhiteSpace(body))
            return;

        try
        {
            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("email", out var emailProperty))
                return;

            var email = emailProperty.GetString()?.Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(email))
                context.Items[ForgotPasswordEmailItemKey] = email;
        }
        catch (JsonException)
        {
            // Invalid JSON is handled later by MVC validation; rate limiting must not log or expose the body.
        }
    }

    private sealed record RateLimitErrorResponse(
        bool Success,
        string? Data,
        string Message,
        IReadOnlyList<string> Errors);

    private sealed record RateLimitRule(
        string PolicyName,
        string RouteKey,
        int PermitLimit,
        TimeSpan Window,
        RateLimitKeyKind KeyKind,
        RateLimitAlgorithm Algorithm)
    {
        public static RateLimitRule GlobalFallback()
        {
            return new RateLimitRule(
                RateLimitPolicies.GlobalFallback,
                "all",
                300,
                TimeSpan.FromMinutes(1),
                RateLimitKeyKind.AuthenticatedUser,
                RateLimitAlgorithm.SlidingWindow);
        }

        public static RateLimitRule ForAuthStrict(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                "/api/auth/login" => Fixed(RateLimitPolicies.AuthStrict, "login", 5, TimeSpan.FromMinutes(15), RateLimitKeyKind.IpAddress),
                "/api/auth/register" => Fixed(RateLimitPolicies.AuthStrict, "register", 10, TimeSpan.FromHours(1), RateLimitKeyKind.IpAddress),
                "/api/auth/forgot-password" => Fixed(RateLimitPolicies.AuthStrict, "forgot-password", 3, TimeSpan.FromHours(1), RateLimitKeyKind.ForgotPasswordEmailAndIp),
                "/api/auth/reset-password" => Fixed(RateLimitPolicies.AuthStrict, "reset-password", 5, TimeSpan.FromMinutes(15), RateLimitKeyKind.IpAddress),
                "/api/auth/verify-email" => Fixed(RateLimitPolicies.AuthStrict, "verify-email", 10, TimeSpan.FromHours(1), RateLimitKeyKind.IpAddress),
                _ => Fixed(RateLimitPolicies.AuthStrict, "default", 5, TimeSpan.FromMinutes(15), RateLimitKeyKind.IpAddress)
            };
        }

        public static RateLimitRule ForAuthToken(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                "/api/auth/refresh" => Fixed(RateLimitPolicies.AuthToken, "refresh", 30, TimeSpan.FromMinutes(15), RateLimitKeyKind.IpAddress),
                "/api/auth/logout" => Fixed(RateLimitPolicies.AuthToken, "logout", 20, TimeSpan.FromMinutes(15), RateLimitKeyKind.IpAddress),
                _ => Fixed(RateLimitPolicies.AuthToken, "default", 20, TimeSpan.FromMinutes(15), RateLimitKeyKind.IpAddress)
            };
        }

        public static RateLimitRule ForAuthenticatedApi(HttpContext context)
        {
            var path = NormalizePath(context);
            var method = context.Request.Method;

            if (path == "/api/clients" && HttpMethods.IsPost(method))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "clients-write", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/dashboard", StringComparison.Ordinal))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "dashboard", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/reports/monthly", StringComparison.Ordinal))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "reports-monthly", 10, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/reports/export", StringComparison.Ordinal))
                return TokenBucket(RateLimitPolicies.ApiAuthenticated, "reports-export", 5, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/payments", StringComparison.Ordinal))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "payments", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path == "/api/users/me" && HttpMethods.IsGet(method))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "users-me-read", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/users/me", StringComparison.Ordinal) && (HttpMethods.IsPut(method) || HttpMethods.IsPost(method)))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "users-me-write", 10, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path == "/api/invoices" && HttpMethods.IsPost(method))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "invoices-write", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/audit-logs", StringComparison.Ordinal))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "audit-logs", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/team", StringComparison.Ordinal))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "team", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            if (path.StartsWith("/api/notifications", StringComparison.Ordinal))
                return Sliding(RateLimitPolicies.ApiAuthenticated, "notifications-polling", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);

            return Sliding(RateLimitPolicies.ApiAuthenticated, "standard", 60, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser);
        }

        public static RateLimitRule ForInvoiceActions(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                string value when value.StartsWith("/api/invoices/", StringComparison.Ordinal) && value.EndsWith("/send", StringComparison.Ordinal) =>
                    TokenBucket(RateLimitPolicies.InvoiceActions, "invoice-send", 10, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                string value when value.StartsWith("/api/invoices/", StringComparison.Ordinal) && value.EndsWith("/resend", StringComparison.Ordinal) =>
                    TokenBucket(RateLimitPolicies.InvoiceActions, "invoice-resend", 5, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                string value when value.StartsWith("/api/invoices/", StringComparison.Ordinal) && value.EndsWith("/mark-paid", StringComparison.Ordinal) =>
                    TokenBucket(RateLimitPolicies.InvoiceActions, "invoice-mark-paid", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                string value when value.StartsWith("/api/invoices/", StringComparison.Ordinal) && value.EndsWith("/cancel", StringComparison.Ordinal) =>
                    TokenBucket(RateLimitPolicies.InvoiceActions, "invoice-cancel", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                string value when value.StartsWith("/api/invoices/", StringComparison.Ordinal) && value.EndsWith("/duplicate", StringComparison.Ordinal) =>
                    TokenBucket(RateLimitPolicies.InvoiceActions, "invoice-duplicate", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                string value when value.StartsWith("/api/invoices/", StringComparison.Ordinal) && value.EndsWith("/pdf", StringComparison.Ordinal) =>
                    TokenBucket(RateLimitPolicies.InvoiceActions, "invoice-pdf", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                "/api/users/me/logo" => TokenBucket(RateLimitPolicies.InvoiceActions, "user-logo", 5, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                _ => TokenBucket(RateLimitPolicies.InvoiceActions, "default", 10, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser)
            };
        }

        public static RateLimitRule ForStripe(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                "/api/stripe/webhook" => Fixed(RateLimitPolicies.StripeWebhooks, "stripe-webhook", 200, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress),
                "/api/stripe/connect/callback" => Fixed(RateLimitPolicies.StripeWebhooks, "stripe-connect-callback", 50, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress),
                _ => Fixed(RateLimitPolicies.StripeWebhooks, "default", 50, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress)
            };
        }

        public static RateLimitRule ForPublicPaymentPages(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                string value when value.StartsWith("/pay/", StringComparison.Ordinal) =>
                    Sliding(RateLimitPolicies.PublicPaymentPages, "payment-page", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress),
                string value when value.StartsWith("/api/invoices/track/", StringComparison.Ordinal) =>
                    Sliding(RateLimitPolicies.PublicPaymentPages, "invoice-tracking-pixel", 60, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress),
                _ => Sliding(RateLimitPolicies.PublicPaymentPages, "default", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress)
            };
        }

        public static RateLimitRule ForSubscriptions(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                "/api/subscriptions/checkout" => TokenBucket(RateLimitPolicies.Subscriptions, "subscription-checkout", 5, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                "/api/subscriptions/portal" => TokenBucket(RateLimitPolicies.Subscriptions, "subscription-portal", 5, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                "/api/subscriptions/cancel" => TokenBucket(RateLimitPolicies.Subscriptions, "subscription-cancel", 3, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                "/api/subscriptions/status" => Sliding(RateLimitPolicies.Subscriptions, "subscription-status", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                "/api/subscriptions/plans" => Sliding(RateLimitPolicies.Subscriptions, "subscription-plans", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.IpAddress),
                "/api/stripe/connect" => TokenBucket(RateLimitPolicies.Subscriptions, "stripe-connect-start", 5, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                _ => Sliding(RateLimitPolicies.Subscriptions, "subscription-current", 20, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser)
            };
        }

        public static RateLimitRule ForAdminEndpoints(HttpContext context)
        {
            var path = NormalizePath(context);
            return path switch
            {
                string value when value.EndsWith("/plan", StringComparison.Ordinal) =>
                    Sliding(RateLimitPolicies.AdminEndpoints, "admin-plan", 10, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                string value when value.EndsWith("/trial", StringComparison.Ordinal) =>
                    Sliding(RateLimitPolicies.AdminEndpoints, "admin-trial", 10, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser),
                _ => Sliding(RateLimitPolicies.AdminEndpoints, "admin-read", 30, TimeSpan.FromMinutes(1), RateLimitKeyKind.AuthenticatedUser)
            };
        }

        private static RateLimitRule Fixed(
            string policyName,
            string routeKey,
            int permitLimit,
            TimeSpan window,
            RateLimitKeyKind keyKind)
        {
            return new RateLimitRule(policyName, routeKey, permitLimit, window, keyKind, RateLimitAlgorithm.FixedWindow);
        }

        private static RateLimitRule Sliding(
            string policyName,
            string routeKey,
            int permitLimit,
            TimeSpan window,
            RateLimitKeyKind keyKind)
        {
            return new RateLimitRule(policyName, routeKey, permitLimit, window, keyKind, RateLimitAlgorithm.SlidingWindow);
        }

        private static RateLimitRule TokenBucket(
            string policyName,
            string routeKey,
            int permitLimit,
            TimeSpan window,
            RateLimitKeyKind keyKind)
        {
            return new RateLimitRule(policyName, routeKey, permitLimit, window, keyKind, RateLimitAlgorithm.TokenBucket);
        }

        private static string NormalizePath(HttpContext context)
        {
            return (context.Request.Path.Value ?? string.Empty).TrimEnd('/').ToLowerInvariant();
        }
    }

    private enum RateLimitAlgorithm
    {
        FixedWindow,
        SlidingWindow,
        TokenBucket
    }

    private enum RateLimitKeyKind
    {
        IpAddress,
        AuthenticatedUser,
        ForgotPasswordEmailAndIp
    }
}
