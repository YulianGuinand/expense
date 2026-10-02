using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;
using Xunit;

public class UserControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public UserControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAllUsers_WithoutToken_ShouldReturnUnauthorized()
    {
        var response = await _client.GetAsync("/api/User");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AdminDashboard_WithoutToken_ShouldReturnUnauthorized()
    {
        var response = await _client.GetAsync("/api/User/admin-only");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}