using System.Net;
using backend.Tests.IntegrationTests;
using FluentAssertions;
using Xunit;

public class UserControllerIntegrationTests : IClassFixture<ExpenseApiFactory>
{
    private readonly HttpClient _client;

    public UserControllerIntegrationTests(ExpenseApiFactory factory)
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

    [Fact]
    public async Task GetCurrentUser_WithoutToken_ShouldReturnUnauthorized()
    {
        var response = await _client.GetAsync("/api/User/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateCurrentUser_WithoutToken_ShouldReturnUnauthorized()
    {
        var content = new StringContent("{\"username\":\"NewName\"}", System.Text.Encoding.UTF8, "application/json");
        var response = await _client.PutAsync("/api/User/me", content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}