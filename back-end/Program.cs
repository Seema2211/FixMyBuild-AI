using System.Text;
using System.Text.Json.Serialization;
using FixMyBuildApi.Data;
using FixMyBuildApi.Extensions;
using FixMyBuildApi.Services;
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

builder.Services.AddAuthorization();

// ── HTTP Clients ──────────────────────────────────────────────
builder.Services.AddHttpClient("GitHub", client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github.v3+json");
});

builder.Services.AddHttpClient("GitHubLogsDownload", client =>
{
    client.Timeout = TimeSpan.FromMinutes(2);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FixMyBuild-AI");
});

builder.Services.AddHttpClient<IAIAnalyzerService, AIAnalyzerService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

// ── Services ──────────────────────────────────────────────────
builder.Services.AddScoped<IGitHubService, GitHubService>();
builder.Services.AddScoped<IPipelineService, PipelineService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IEmailSenderService, EmailSenderService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

// ── Background Worker ─────────────────────────────────────────
builder.Services.AddHostedService<PipelineMonitorWorker>();

// ── CORS ──────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
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

app.Run();
