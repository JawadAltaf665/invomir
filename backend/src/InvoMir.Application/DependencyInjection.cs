using InvoMir.Application.Common.Behaviours;
using InvoMir.Application.Features.Dashboard.ActionItems;
using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Security;

namespace InvoMir.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration =>
            configuration.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        services.AddApplicationValidators();
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        services.AddSingleton<IRolePermissionProvider, DefaultRolePermissionProvider>();
        services.AddSingleton<IPermissionChecker, ClaimsPermissionChecker>();
        services.AddScoped<IDashboardActionItemProvider, PaymentAccountRequiredDashboardActionItemProvider>();
        services.AddScoped<IDashboardActionItemProvider, SubscriptionDashboardActionItemProvider>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }

    private static void AddApplicationValidators(this IServiceCollection services)
    {
        var validatorInterfaceType = typeof(IValidator<>);
        var validatorTypes = typeof(DependencyInjection).Assembly
            .DefinedTypes
            .Where(type => type is { IsAbstract: false, IsInterface: false })
            .Select(type => new
            {
                Implementation = type.AsType(),
                Services = type.ImplementedInterfaces
                    .Where(@interface =>
                        @interface.IsGenericType &&
                        @interface.GetGenericTypeDefinition() == validatorInterfaceType)
                    .ToList()
            })
            .Where(type => type.Services.Count > 0);

        foreach (var validatorType in validatorTypes)
        {
            foreach (var serviceType in validatorType.Services)
                services.AddScoped(serviceType, validatorType.Implementation);
        }
    }
}
