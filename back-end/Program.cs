using System.Text;
using System.Text.Json.Serialization;
using FixMyBuildApi.Data;
using FixMyBuildApi.Extensions;
using FixMyBuildApi.Services;
using FixMyBuildApi.Services.Providers;
using FixMyBuildApi.Workers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── JSON: serialize enums as strings ──────────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// ── Configuration ─────────────────────────────────────────────
builder.Configuration.AddEnvironmentVariables();

// ── Database: PostgreSQL ──────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Default"),
        npgsql => npgsql.EnableRetryOnFailure(3)
    ));

// ── Authentication: JWT ───────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero,  // no tolerance — token expires exactly on time
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdmin", policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim("superAdmin", "true"));
});

// ── HTTP Clients ──────────────────────────────────────────────
builder.Services.AddHttpClient("WebhookDelivery", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FixMyBuild-Webhooks/1.0");
});

builder.Services.AddHttpClient("GitHub", client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github.v3+json");
    client.Timeout = TimeSpan.FromSeconds(30);
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    UseProxy = true,
    Proxy = System.Net.WebRequest.GetSystemWebProxy(),
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
});

builder.Services.AddHttpClient("GitHubLogsDownload", client =>
{
    client.Timeout = TimeSpan.FromMinutes(2);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FixMyBuild-AI");
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    UseProxy = true,
    Proxy = System.Net.WebRequest.GetSystemWebProxy(),
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
});

builder.Services.AddHttpClient<IAIAnalyzerService, AIAnalyzerService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

// ── Services ──────────────────────────────────────────────────
builder.Services.AddScoped<IGitHubService, GitHubService>();
builder.Services.AddScoped<IPipelineService, PipelineService>();

// ── VCS providers (one per supported platform) ───────────────
builder.Services.AddScoped<IVcsProvider, GitHubVcsProvider>();
builder.Services.AddScoped<IVcsProvider, GitLabVcsProvider>();
builder.Services.AddScoped<IVcsProvider, AzureDevOpsVcsProvider>();
builder.Services.AddScoped<IAutoFixService, AutoFixService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IEmailSenderService, EmailSenderService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddSingleton<ISseService, SseService>();
builder.Services.AddScoped<IWebhookDeliveryService, WebhookDeliveryService>();

// ── Background Worker ─────────────────────────────────────────
builder.Services.AddHostedService<PipelineMonitorWorker>();

// ── CORS ──────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>See
    {
        policy.WithOrigins(
                builder.Configuration["AllowedOrigins"] ?? "http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// ── Run EF Core Migrations ───────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// ── Middleware ────────────────────────────────────────────────
// Stripe webhook needs raw request body — disable buffering for that route
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/billing/webhook"))
        context.Request.EnableBuffering();
    await next();
});

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// ── Endpoints ─────────────────────────────────────────────────
app.MapAuthEndpoints();
app.MapPipelineEndpoints();
app.MapConfigEndpoints();
app.MapIngestEndpoints();
app.MapOnboardingEndpoints();
app.MapTeamEndpoints();
app.MapAuditEndpoints();
app.MapBillingEndpoints();
app.MapAdminEndpoints();
app.MapProfileEndpoints();
app.MapSseEndpoints();
app.MapNotificationEndpoints();
app.MapWebhookEndpoints();

app.Run();
