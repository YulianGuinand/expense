using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Tests.IntegrationTests;

public class TransactionControllerIntegrationTests : IClassFixture<ExpenseApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    private readonly ExpenseApiFactory _factory;

    public TransactionControllerIntegrationTests(ExpenseApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetAll_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Transaction");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetSummary_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Transaction/summary");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetById_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Transaction/1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/Transaction", NewExpenseDto(1), JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Update_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/Transaction/1", NewExpenseDto(1), JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.DeleteAsync("/api/Transaction/1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithValidExpense_ShouldReturnCreated_AndSerializeTypeAsString()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id), JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var rawBody = await response.Content.ReadAsStringAsync();
        rawBody.Should().Contain("\"type\":\"expense\"");

        var transaction = await response.Content.ReadFromJsonAsync<TransactionResponseDto>(JsonOptions);
        transaction.Should().NotBeNull();
        transaction!.Id.Should().BeGreaterThan(0);
        transaction.Type.Should().Be(TransactionType.Expense);
        transaction.Amount.Should().Be(650f);
        transaction.Category.Should().Be("rent");
        transaction.WalletId.Should().Be(wallet.Id);
    }

    [Fact]
    public async Task Create_WithZeroAmount_ShouldReturnBadRequest()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, amount: 0f), JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();
        body!.Message.Should().Be("Le montant doit être supérieur à 0.");
    }

    [Fact]
    public async Task Create_WithUnknownWallet_ShouldReturnNotFound()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(9999), JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();
        body!.Message.Should().Be("Portefeuille introuvable.");
    }

    [Fact]
    public async Task Create_ShouldUpdateWalletTotals()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync("/api/Transaction", NewExpenseDto(wallet.Id), JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 1000f, "salary", new DateTime(2026, 6, 1), "Salaire", wallet.Id),
            JsonOptions);

        var updated = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{wallet.Id}", JsonOptions);

        updated!.TotalExpenses.Should().Be(650f);
        updated.TotalIncome.Should().Be(1000f);
        updated.Amount.Should().Be(350f);
    }

    [Fact]
    public async Task GetAll_ShouldFilterByTypeAndRespectLimit()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 2200f, "salary", new DateTime(2026, 6, 1), null, wallet.Id),
            JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, date: new DateTime(2026, 6, 2)), JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, date: new DateTime(2026, 6, 3)), JsonOptions);

        var incomes = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?type=income", JsonOptions);
        incomes.Should().ContainSingle().Which.Type.Should().Be(TransactionType.Income);

        var limited = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?limit=1", JsonOptions);
        limited.Should().ContainSingle().Which.Date.Should().Be(new DateTime(2026, 6, 3));
    }

    [Fact]
    public async Task GetAll_ShouldOnlyReturnCurrentUserTransactions()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletA = await GetDefaultWalletAsync(clientA);
        var walletB = await GetDefaultWalletAsync(clientB);

        await clientA.PostAsJsonAsync("/api/Transaction", NewExpenseDto(walletA.Id), JsonOptions);
        await clientB.PostAsJsonAsync("/api/Transaction", NewExpenseDto(walletB.Id, amount: 30f), JsonOptions);

        var transactionsA = await clientA.GetFromJsonAsync<List<TransactionResponseDto>>("/api/Transaction", JsonOptions);
        var transactionsB = await clientB.GetFromJsonAsync<List<TransactionResponseDto>>("/api/Transaction", JsonOptions);

        transactionsA.Should().ContainSingle().Which.Amount.Should().Be(650f);
        transactionsB.Should().ContainSingle().Which.Amount.Should().Be(30f);
    }

    [Fact]
    public async Task GetAll_WithSearchQuery_ShouldReturnMatchingTransactions()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 2200f, "salary", new DateTime(2026, 6, 1), "Salaire", wallet.Id),
            JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, date: new DateTime(2026, 6, 2)), JsonOptions);

        var search = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?q=LOyer", JsonOptions);

        search.Should().ContainSingle();
        search![0].Description.Should().Be("Loyer appartement");
    }

    [Fact]
    public async Task GetAll_WithOffset_ShouldReturnNextPage_WithoutOverlap()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, date: new DateTime(2026, 6, 3)), JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, amount: 100f, date: new DateTime(2026, 6, 2)), JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, amount: 50f, date: new DateTime(2026, 6, 1)), JsonOptions);

        var firstPage = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?limit=2&offset=0", JsonOptions);
        var secondPage = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?limit=2&offset=2", JsonOptions);

        firstPage.Should().HaveCount(2);
        firstPage![0].Date.Should().Be(new DateTime(2026, 6, 3));
        firstPage[1].Date.Should().Be(new DateTime(2026, 6, 2));
        secondPage.Should().ContainSingle();
        secondPage![0].Date.Should().Be(new DateTime(2026, 6, 1));
        firstPage.Select(t => t.Id).Should().NotIntersectWith(secondPage.Select(t => t.Id));
    }

    [Fact]
    public async Task GetAll_WithTypeAliasQuery_ShouldMatchType()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 1000f, "gift", new DateTime(2026, 6, 1), "Cadeau", wallet.Id),
            JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, date: new DateTime(2026, 6, 2)), JsonOptions);

        var incomes = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?q=income", JsonOptions);
        var expenses = await client.GetFromJsonAsync<List<TransactionResponseDto>>(
            "/api/Transaction?q=expense", JsonOptions);

        incomes.Should().ContainSingle().Which.Type.Should().Be(TransactionType.Income);
        expenses.Should().ContainSingle().Which.Type.Should().Be(TransactionType.Expense);
    }

    [Fact]
    public async Task Summary_ShouldAggregateIncomeAndExpenses()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 1000f, "salary", new DateTime(2026, 6, 1), null, wallet.Id),
            JsonOptions);
        await client.PostAsJsonAsync("/api/Transaction", NewExpenseDto(wallet.Id), JsonOptions);

        var summary = await client.GetFromJsonAsync<TransactionSummaryDto>("/api/Transaction/summary", JsonOptions);

        summary!.TotalIncome.Should().Be(1000f);
        summary.TotalExpenses.Should().Be(650f);
        summary.Balance.Should().BeApproximately(350f, 0.01f);
    }

    [Fact]
    public async Task GetById_TransactionOfAnotherUser_ShouldReturnNotFound()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletA = await GetDefaultWalletAsync(clientA);
        var created = await CreateTransactionAsync(clientA, NewExpenseDto(walletA.Id));

        var response = await clientB.GetAsync($"/api/Transaction/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_TransactionOfAnotherUser_ShouldReturnNotFound_AndKeepDataIntact()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletA = await GetDefaultWalletAsync(clientA);
        var created = await CreateTransactionAsync(clientA, NewExpenseDto(walletA.Id));

        var response = await clientB.PutAsJsonAsync(
            $"/api/Transaction/{created.Id}",
            new TransactionUpdateDto(TransactionType.Income, 9999f, "gift", new DateTime(2026, 6, 10), null, walletA.Id),
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var intact = await clientA.GetFromJsonAsync<TransactionResponseDto>(
            $"/api/Transaction/{created.Id}", JsonOptions);
        intact!.Type.Should().Be(TransactionType.Expense);
        intact.Amount.Should().Be(650f);
    }

    [Fact]
    public async Task Update_WithOwnTransaction_ShouldModifyIt_AndUpdateTotals()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);
        var created = await CreateTransactionAsync(client, NewExpenseDto(wallet.Id));

        var response = await client.PutAsJsonAsync(
            $"/api/Transaction/{created.Id}",
            new TransactionUpdateDto(TransactionType.Expense, 100f, "food", new DateTime(2026, 6, 12), "Courses", wallet.Id),
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<TransactionResponseDto>(JsonOptions);
        updated!.Amount.Should().Be(100f);

        var reloadedWallet = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{wallet.Id}", JsonOptions);
        reloadedWallet!.TotalExpenses.Should().Be(100f);
        reloadedWallet.Amount.Should().Be(-100f);
    }

    [Fact]
    public async Task Delete_ShouldRemoveTransaction_AndUpdateTotals()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);
        var created = await CreateTransactionAsync(client, NewExpenseDto(wallet.Id));

        var response = await client.DeleteAsync($"/api/Transaction/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();
        body!.Message.Should().Be("Transaction supprimée.");

        var remaining = await client.GetFromJsonAsync<List<TransactionResponseDto>>("/api/Transaction", JsonOptions);
        remaining.Should().BeEmpty();

        var reloadedWallet = await client.GetFromJsonAsync<WalletResponseDto>($"/api/Wallet/{wallet.Id}", JsonOptions);
        reloadedWallet!.Amount.Should().Be(0f);
        reloadedWallet.TotalExpenses.Should().Be(0f);
    }

    [Fact]
    public async Task Delete_Wallet_ShouldCascadeItsTransactions()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var defaultWallet = await GetDefaultWalletAsync(client);
        var walletResponse = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Éphémère"));
        walletResponse.EnsureSuccessStatusCode();
        var disposableWallet = await walletResponse.Content.ReadFromJsonAsync<WalletResponseDto>(JsonOptions);

        await CreateTransactionAsync(client, NewExpenseDto(disposableWallet!.Id));
        await CreateTransactionAsync(client, NewExpenseDto(defaultWallet.Id, amount: 30f));

        var deleteResponse = await client.DeleteAsync($"/api/Wallet/{disposableWallet.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var remaining = await client.GetFromJsonAsync<List<TransactionResponseDto>>("/api/Transaction", JsonOptions);
        remaining.Should().ContainSingle().Which.Amount.Should().Be(30f);
    }

    [Fact]
    public async Task GetMonthly_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Transaction/monthly");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MonthlyStats_ShouldReturnSixZeroFilledBuckets_AndAggregateCurrentMonth()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var wallet = await GetDefaultWalletAsync(client);

        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 1000f, "salary", CurrentMonthDay(5), null, wallet.Id),
            JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(wallet.Id, date: CurrentMonthDay(10)), JsonOptions);

        var rawBody = await client.GetStringAsync("/api/Transaction/monthly?months=6");
        rawBody.Should().Contain("\"period\"").And.Contain("\"income\"").And.Contain("\"expenses\"");

        var stats = await client.GetFromJsonAsync<List<TransactionMonthlyDto>>(
            "/api/Transaction/monthly?months=6", JsonOptions);

        stats.Should().HaveCount(6);
        stats!.Select(s => s.Period).Should().BeInAscendingOrder();
        stats.Take(5).Should().OnlyContain(s => s.Income == 0f && s.Expenses == 0f);
        stats[^1].Income.Should().Be(1000f);
        stats[^1].Expenses.Should().Be(650f);
    }

    [Fact]
    public async Task MonthlyStats_ShouldFilterByWallet()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var defaultWallet = await GetDefaultWalletAsync(client);
        var secondResponse = await client.PostAsJsonAsync("/api/Wallet", new WalletCreateDto("Épargne"));
        secondResponse.EnsureSuccessStatusCode();
        var secondWallet = await secondResponse.Content.ReadFromJsonAsync<WalletResponseDto>(JsonOptions);

        await client.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 1000f, "salary", CurrentMonthDay(5), null, defaultWallet.Id),
            JsonOptions);
        await client.PostAsJsonAsync(
            "/api/Transaction", NewExpenseDto(secondWallet!.Id, amount: 100f, date: CurrentMonthDay(6)), JsonOptions);

        var all = await client.GetFromJsonAsync<List<TransactionMonthlyDto>>(
            "/api/Transaction/monthly?months=6", JsonOptions);
        var filtered = await client.GetFromJsonAsync<List<TransactionMonthlyDto>>(
            $"/api/Transaction/monthly?walletId={secondWallet.Id}&months=6", JsonOptions);

        all![^1].Income.Should().Be(1000f);
        all[^1].Expenses.Should().Be(100f);
        filtered![^1].Income.Should().Be(0f);
        filtered[^1].Expenses.Should().Be(100f);
    }

    [Fact]
    public async Task MonthlyStats_ShouldRespectMonthsParameter_AndDefaultToTwelve()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var threeMonths = await client.GetFromJsonAsync<List<TransactionMonthlyDto>>(
            "/api/Transaction/monthly?months=3", JsonOptions);
        var defaultRange = await client.GetFromJsonAsync<List<TransactionMonthlyDto>>(
            "/api/Transaction/monthly", JsonOptions);

        threeMonths.Should().HaveCount(3);
        defaultRange.Should().HaveCount(12);
    }

    [Fact]
    public async Task MonthlyStats_ShouldOnlyAggregateCurrentUserTransactions()
    {
        var clientA = await _factory.CreateAuthenticatedClientAsync();
        var clientB = await _factory.CreateAuthenticatedClientAsync();
        var walletA = await GetDefaultWalletAsync(clientA);

        await clientA.PostAsJsonAsync(
            "/api/Transaction",
            new TransactionCreateDto(TransactionType.Income, 1000f, "salary", CurrentMonthDay(5), null, walletA.Id),
            JsonOptions);

        var statsB = await clientB.GetFromJsonAsync<List<TransactionMonthlyDto>>(
            "/api/Transaction/monthly?months=6", JsonOptions);

        statsB.Should().HaveCount(6);
        statsB.Should().OnlyContain(s => s.Income == 0f && s.Expenses == 0f);
    }

    private static DateTime CurrentMonthDay(int day) =>
        new DateTime(DateTime.Today.Year, DateTime.Today.Month, day);

    private static async Task<WalletResponseDto> GetDefaultWalletAsync(HttpClient client)
    {
        var wallets = await client.GetFromJsonAsync<List<WalletResponseDto>>("/api/Wallet", JsonOptions);
        return wallets!.Single(w => w.Name == WalletService.DefaultWalletName);
    }

    private static async Task<TransactionResponseDto> CreateTransactionAsync(HttpClient client, TransactionCreateDto dto)
    {
        var response = await client.PostAsJsonAsync("/api/Transaction", dto, JsonOptions);
        response.EnsureSuccessStatusCode();

        var transaction = await response.Content.ReadFromJsonAsync<TransactionResponseDto>(JsonOptions);
        return transaction ?? throw new InvalidOperationException("Reponse de creation de transaction vide.");
    }

    private static TransactionCreateDto NewExpenseDto(int walletId, float amount = 650f, DateTime? date = null) =>
        new(TransactionType.Expense, amount, "rent", date ?? new DateTime(2026, 6, 2), "Loyer appartement", walletId);

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        return options;
    }

    private record ErrorDto(string Message);
}
