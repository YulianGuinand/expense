using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using FluentAssertions;
using Xunit;
using backend.Models;
using backend.Services;

public class AuthServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?> {
            {"Jwt:Key", "super_secret_key_long_enough_for_testing_123456"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _authService = new AuthService(_configuration);
    }

    [Fact]
    public void GenerateJwtToken_ShouldReturnValidToken_WithCorrectClaims()
    {
        var user = new User
        {
            Id = 1,
            Username = "Yulian",
            Email = "yulian@test.com",
            Role = "Admin"
        };

        var token = _authService.GenerateJwtToken(user);

        token.Should().NotBeNullOrEmpty();

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        jwtToken.Claims.FirstOrDefault(c => c.Type.EndsWith("name"))?.Value.Should().Be("Yulian");
        jwtToken.Claims.FirstOrDefault(c => c.Type.EndsWith("emailaddress") || c.Type.EndsWith("email"))?.Value.Should().Be("yulian@test.com");
        jwtToken.Claims.FirstOrDefault(c => c.Type.EndsWith("role"))?.Value.Should().Be("Admin");
    }
}