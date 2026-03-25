using System.Security.Claims;

namespace FixMyBuildApi.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Returns the authenticated user's ID, or null if not present/invalid.</summary>
    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? principal.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : null;
    }

    /// <summary>Returns the authenticated user's organization ID, or null if not present/invalid.</summary>
    public static Guid? GetOrgId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue("orgId");
        return Guid.TryParse(value, out var id) ? id : null;
    }

    /// <summary>Returns the authenticated user's role claim.</summary>
    public static string? GetRole(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimTypes.Role)       // JWT middleware maps "role" → ClaimTypes.Role
        ?? principal.FindFirstValue("role");               // fallback for raw "role" claim

    /// <summary>Returns true if the authenticated user has the superAdmin claim.</summary>
    public static bool IsSuperAdmin(this ClaimsPrincipal principal)
        => principal.FindFirstValue("superAdmin") == "true";
}
