using InvoMir.API.Extensions;
using InvoMir.API.Middlewares;
using InvoMir.Application;
using InvoMir.Infrastructure;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "InvoMir API", Version = "v1" });
    options.AddServer(new OpenApiServer { Url = "/" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT access token."
    });

    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", null),
            []
        }
    });
});

builder.Services.AddCors(options =>
    options.AddPolicy("InvoMirPolicy", policy =>
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://invomir.com",
                "https://www.invomir.com")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseCors("InvoMirPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
