using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FixMyBuildApi.Services;
using Microsoft.IdentityModel.Tokens;

namespace FixMyBuildApi.Extensions;

public static class SseEndpoints
{
    public static void MapSseEndpoints(this WebApplication app)
    {
        // GET /api/pipelines/stream?token=<jwt>
        // EventSource doesn't support custom headers, so JWT is passed as query param
        app.MapGet("/api/pipelines/stream", async (HttpContext context, ISseService sseService, IConfiguration config, CancellationToken ct) =>
        {
            var token = context.Request.Query["token"].ToString();
            var orgId = ValidateJwtGetOrgId(token, config);
            if (orgId is null)
            {
                context.Response.StatusCode = 401;
                return;
            }

            context.Response.ContentType = "text/event-stream";
            context.Response.Headers["Cache-Control"] = "no-cache";
            context.Response.Headers["X-Accel-Buffering"] = "no";
            context.Response.Headers["Connection"] = "keep-alive";

            // Initial heartbeat so client knows connection is live
            await context.Response.WriteAsync("data: {\"type\":\"connected\"}\n\n", ct);
            await context.Response.Body.FlushAsync(ct);

            var reader = sseService.Subscribe(orgId.Value);
            try
            {
                // Heartbeat every 25s to keep connection alive through proxies
                using var heartbeat = new PeriodicTimer(TimeSpan.FromSeconds(25));
                var heartbeatTask = Task.Run(async () =>
                {
                    while (await heartbeat.WaitForNextTickAsync(ct))
                    {
                        try
                        {
                            await context.Response.WriteAsync(": heartbeat\n\n", ct);
                            await context.Response.Body.FlushAsync(ct);
                        }
                        catch { break; }
                    }
                }, ct);

                await foreach (var msg in reader.ReadAllAsync(ct))
                {
                    await context.Response.WriteAsync($"data: {msg}\n\n", ct);
                    await context.Response.Body.FlushAsync(ct);
                }
            }
            catch (OperationCanceledException) { }
            finally
            {
                sseService.Unsubscribe(orgId.Value, reader);
            }
        });
    }

    private static Guid? ValidateJwtGetOrgId(string token, IConfiguration config)
    {
        if (string.IsNullOrEmpty(token)) return null;
        try
        {
            var secret = config["Jwt:Secret"] ?? throw new InvalidOperationException();
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true, ValidIssuer = config["Jwt:Issuer"],
                ValidateAudience = true, ValidAudience = config["Jwt:Audience"],
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ClockSkew = TimeSpan.Zero,
            }, out _);

            var orgIdStr = principal.FindFirstValue("orgId");
            return Guid.TryParse(orgIdStr, out var id) ? id : null;
        }
        catch { return null; }
    }
}
