using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;
using Xunit;
using backend.DTOs;

public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        var loginDto = new UserLoginDto("inexistant@test.com", "mauvaisepassword");

        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_WithMissingFields_ShouldReturnBadRequest()
    {
        var registerDto = new UserRegisterDto("", "", "");

        var response = await _client.PostAsJsonAsync("/api/Auth/register", registerDto);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}