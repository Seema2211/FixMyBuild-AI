using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user, Guid organizationId, string role, bool isSuperAdmin = false);
    (string rawToken, string tokenHash) GenerateRefreshToken();
    string HashToken(string token);
    string GenerateApiKey(out string keyHash, out string keyPrefix);
}
