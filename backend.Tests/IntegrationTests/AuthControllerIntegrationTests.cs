using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;
using backend.DTOs;
using backend.Services;
using backend.Tests.IntegrationTests;

public class AuthControllerIntegrationTests : IClassFixture<ExpenseApiFactory>
{
    private readonly HttpClient _client;

    public AuthControllerIntegrationTests(ExpenseApiFactory factory)
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

    [Fact]
    public async Task Register_WithValidData_ShouldCreateDefaultWallet()
    {
        var authResponse = await TestAuthHelper.RegisterAsync(
            _client,
            "NouveauUtilisateur",
            TestAuthHelper.GenerateUniqueEmail());

        _client.SetBearerToken(authResponse.Token);

        var wallets = await _client.GetFromJsonAsync<List<WalletResponseDto>>("/api/Wallet");

        wallets.Should().NotBeNull();
        wallets.Should().ContainSingle();
        wallets![0].Id.Should().BeGreaterThan(0);
        wallets[0].Name.Should().Be(WalletService.DefaultWalletName);
        wallets[0].Amount.Should().Be(0);
        wallets[0].TotalIncome.Should().Be(0);
        wallets[0].TotalExpenses.Should().Be(0);
    }
}