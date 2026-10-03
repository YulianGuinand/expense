using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using backend.DTOs;
using backend.Services;

namespace backend.Tests.IntegrationTests;

public class WalletControllerIntegrationTests : IClassFixture<ExpenseApiFactory>
{
    private readonly ExpenseApiFactory _factory;

    public WalletControllerIntegrationTests(ExpenseApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetAll_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Wallet");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetById_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Wallet/1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Personnel"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Update_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/Wallet/1", new WalletUpdateDto("Personnel"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.DeleteAsync("/api/Wallet/1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithValidName_ShouldReturnCreated_WithZeroAmounts()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Livret A"));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var wallet = await response.Content.ReadFromJsonAsync<WalletResponseDto>();
        wallet.Should().NotBeNull();
        wallet!.Id.Should().BeGreaterThan(0);
        wallet.Name.Should().Be("Livret A");
        wallet.Amount.Should().Be(0);
        wallet.TotalIncome.Should().Be(0);
        wallet.TotalExpenses.Should().Be(0);
    }

    [Fact]
    public async Task Create_WithBlankName_ShouldReturnBadRequest()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("   "));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();
        body!.Message.Should().Be("Le nom du portefeuille est requis.");
    }

    [Fact]
    public async Task GetAll_ShouldReturnCurrentUserWalletsOnly()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();

        await clientA.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Portefeuille A1"));
        await clientA.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Portefeuille A2"));
        await clientB.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Portefeuille B1"));

        var walletsA = await clientA.GetFromJsonAsync<List<WalletResponseDto>>("/api/Wallet");
        var walletsB = await clientB.GetFromJsonAsync<List<WalletResponseDto>>("/api/Wallet");

        walletsA.Should().HaveCount(3);
        walletsA.Count(w => w.Name.StartsWith("Portefeuille A")).Should().Be(2);
        walletsA.Should().Contain(w => w.Name == WalletService.DefaultWalletName);
        walletsB.Should().HaveCount(2);
        walletsB.Should().Contain(w => w.Name == "Portefeuille B1");
    }

    [Fact]
    public async Task GetById_WithOwnWallet_ShouldReturnOk()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var created = await CreateWalletAsync(client, "Personnel");

        var wallet = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{created.Id}");

        wallet.Should().NotBeNull();
        wallet!.Name.Should().Be("Personnel");
    }

    [Fact]
    public async Task Update_WithOwnWallet_ShouldRenameIt()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var created = await CreateWalletAsync(client, "Ancien nom");

        var response = await client.PutAsJsonAsync($"/api/Wallet/{created.Id}", new WalletUpdateDto("Nouveau nom"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<WalletResponseDto>();
        updated!.Id.Should().Be(created.Id);
        updated.Name.Should().Be("Nouveau nom");

        var reloaded = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{created.Id}");
        reloaded!.Name.Should().Be("Nouveau nom");
    }

    [Fact]
    public async Task Update_WithBlankName_ShouldReturnBadRequest()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var created = await CreateWalletAsync(client, "Valide");

        var response = await client.PutAsJsonAsync($"/api/Wallet/{created.Id}", new WalletUpdateDto(""));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_WalletOfAnotherUser_ShouldReturnNotFound()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletOfA = await CreateWalletAsync(clientA, "Prive");

        var response = await clientB.PutAsJsonAsync($"/api/Wallet/{walletOfA.Id}", new WalletUpdateDto("Piratage"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var untouched = await clientA.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{walletOfA.Id}");
        untouched!.Name.Should().Be("Prive");
    }

    [Fact]
    public async Task Delete_WithOwnWallet_ShouldRemoveIt()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var created = await CreateWalletAsync(client, "A supprimer");

        var response = await client.DeleteAsync($"/api/Wallet/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var afterDeletion = await client.GetAsync($"/api/Wallet/{created.Id}");
        afterDeletion.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var remaining = await client.GetFromJsonAsync<List<WalletResponseDto>>("/api/Wallet");
        remaining.Should().NotContain(w => w.Id == created.Id);
        remaining.Should().Contain(w => w.Name == WalletService.DefaultWalletName);
    }

    [Fact]
    public async Task Delete_WalletOfAnotherUser_ShouldReturnNotFound()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletOfA = await CreateWalletAsync(clientA, "Intact");

        var response = await clientB.DeleteAsync($"/api/Wallet/{walletOfA.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var remaining = await clientA.GetFromJsonAsync<List<WalletResponseDto>>("/api/Wallet");
        remaining.Should().HaveCount(2);
        remaining.Should().Contain(w => w.Id == walletOfA.Id);
    }

    [Fact]
    public async Task GetById_WalletOfAnotherUser_ShouldReturnNotFound()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletOfA = await CreateWalletAsync(clientA, "Masque");

        var response = await clientB.GetAsync($"/api/Wallet/{walletOfA.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_WithGoal_ShouldReturnCreated_WithGoal()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Épargne", 1000f));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var rawBody = await response.Content.ReadAsStringAsync();
        rawBody.Should().Contain("\"goal\":1000");

        var wallet = await response.Content.ReadFromJsonAsync<WalletResponseDto>();
        wallet!.Goal.Should().Be(1000f);
    }

    [Fact]
    public async Task Create_WithNonPositiveGoal_ShouldReturnBadRequest()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Épargne", 0f));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();
        body!.Message.Should().Be("L'objectif doit être supérieur à 0.");
    }

    [Fact]
    public async Task Update_ShouldSetAndClearGoal()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var created = await CreateWalletAsync(client, "Épargne");

        var setResponse = await client.PutAsJsonAsync(
            $"/api/Wallet/{created.Id}", new WalletUpdateDto("Épargne", 1000f));
        setResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        (await setResponse.Content.ReadFromJsonAsync<WalletResponseDto>())!.Goal.Should().Be(1000f);

        var clearResponse = await client.PutAsJsonAsync(
            $"/api/Wallet/{created.Id}", new WalletUpdateDto("Épargne"));
        clearResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        (await clearResponse.Content.ReadFromJsonAsync<WalletResponseDto>())!.Goal.Should().BeNull();

        var reloaded = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{created.Id}");
        reloaded!.Goal.Should().BeNull();
    }

    [Fact]
    public async Task Update_WithNonPositiveGoal_ShouldReturnBadRequest_AndKeepGoal()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var created = await CreateWalletAsync(client, "Épargne");
        await client.PutAsJsonAsync($"/api/Wallet/{created.Id}", new WalletUpdateDto("Épargne", 500f));

        var response = await client.PutAsJsonAsync(
            $"/api/Wallet/{created.Id}", new WalletUpdateDto("Épargne", -1f));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();
        body!.Message.Should().Be("L'objectif doit être supérieur à 0.");

        var reloaded = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{created.Id}");
        reloaded!.Goal.Should().Be(500f);
    }

    private static async Task<WalletResponseDto> CreateWalletAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto(name));
        response.EnsureSuccessStatusCode();

        var wallet = await response.Content.ReadFromJsonAsync<WalletResponseDto>();
        return wallet ?? throw new InvalidOperationException("Reponse de creation de portefeuille vide.");
    }

    private record ErrorDto(string Message);
}
