using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Tests.UnitTests;

public class TransactionServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly WalletService _walletService;
    private readonly TransactionService _transactionService;

    private const int UserId = 1;
    private const int OtherUserId = 2;

    private static readonly DateTime ReferenceDate = new(2026, 6, 2);

    public TransactionServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"transaction-service-tests-{Guid.NewGuid()}")
            .Options;

        _context = new AppDbContext(options);
        _walletService = new WalletService(_context);
        _transactionService = new TransactionService(_context);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task CreateExpense_WithValidData_ShouldSucceed_AndUpdateWalletTotals()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId));

        result.Success.Should().BeTrue();
        result.Error.Should().BeNull();
        result.Transaction.Should().NotBeNull();
        result.Transaction!.Id.Should().BeGreaterThan(0);
        result.Transaction.Type.Should().Be(TransactionType.Expense);
        result.Transaction.Amount.Should().Be(650f);
        result.Transaction.Category.Should().Be("rent");
        result.Transaction.Description.Should().Be("Loyer appartement");
        result.Transaction.WalletId.Should().Be(walletId);

        var wallet = await _walletService.GetWalletAsync(UserId, walletId);
        wallet.Wallet!.Amount.Should().Be(-650f);
        wallet.Wallet.TotalExpenses.Should().Be(650f);
        wallet.Wallet.TotalIncome.Should().Be(0f);
    }

    [Fact]
    public async Task CreateIncomeAndExpense_ShouldBalanceWalletTotals()
    {
        var walletId = await CreateWalletAsync(UserId);

        await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId));
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 1000f, "salary", ReferenceDate, "Salaire", walletId));

        var wallet = await _walletService.GetWalletAsync(UserId, walletId);
        wallet.Wallet!.TotalIncome.Should().Be(1000f);
        wallet.Wallet.TotalExpenses.Should().Be(650f);
        wallet.Wallet.Amount.Should().Be(350f);
    }

    [Theory]
    [InlineData(0f)]
    [InlineData(-10f)]
    public async Task Create_WithNonPositiveAmount_ShouldFail(float amount)
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId, amount: amount));

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeFalse();
        result.Error.Should().Be("Le montant doit être supérieur à 0.");
    }

    [Fact]
    public async Task Create_WithUndefinedType_ShouldFail()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto((TransactionType)42, 50f, "food", ReferenceDate, null, walletId));

        result.Success.Should().BeFalse();
        result.Error.Should().Be("Le type de transaction est invalide.");
    }

    [Fact]
    public async Task Create_WithDefaultDate_ShouldFail()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Expense, 650f, "rent", default, "Loyer", walletId));

        result.Success.Should().BeFalse();
        result.Error.Should().Be("La date de transaction est requise.");
    }

    [Fact]
    public async Task Create_WithTooLongCategory_ShouldFail()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId, category: new string('a', 51)));

        result.Success.Should().BeFalse();
        result.Error.Should().Be("La catégorie ne peut pas dépasser 50 caractères.");
    }

    [Fact]
    public async Task Create_WithTooLongDescription_ShouldFail()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId, description: new string('a', 201)));

        result.Success.Should().BeFalse();
        result.Error.Should().Be("La description ne peut pas dépasser 200 caractères.");
    }

    [Fact]
    public async Task Create_ShouldTrimCategoryAndDescription()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId, category: "  food  ", description: "  Courses  "));

        result.Success.Should().BeTrue();
        result.Transaction!.Category.Should().Be("food");
        result.Transaction.Description.Should().Be("Courses");
    }

    [Fact]
    public async Task Create_WithBlankValues_ShouldStoreEmptyOptionals()
    {
        var walletId = await CreateWalletAsync(UserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId, category: "   ", description: null));

        result.Success.Should().BeTrue();
        result.Transaction!.Category.Should().BeNull();
        result.Transaction.Description.Should().BeNull();
    }

    [Fact]
    public async Task Create_WithWalletOfAnotherUser_ShouldReturnNotFound()
    {
        var foreignWalletId = await CreateWalletAsync(OtherUserId);

        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(foreignWalletId));

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeTrue();
        result.Error.Should().Be("Portefeuille introuvable.");
        (await _transactionService.GetTransactionsAsync(OtherUserId)).Should().BeEmpty();
    }

    [Fact]
    public async Task Create_WithUnknownWallet_ShouldReturnNotFound()
    {
        var result = await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(9999));

        result.NotFound.Should().BeTrue();
    }

    [Fact]
    public async Task GetTransactions_ShouldOrderNewestFirst_AndRespectLimit()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 1)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 15)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 8)));

        var transactions = await _transactionService.GetTransactionsAsync(UserId, limit: 2);

        transactions.Should().HaveCount(2);
        transactions[0].Date.Should().Be(new DateTime(2026, 6, 15));
        transactions[1].Date.Should().Be(new DateTime(2026, 6, 8));
    }

    [Fact]
    public async Task GetTransactions_ShouldFilterByTypeCategoryWalletAndPeriod()
    {
        var walletId = await CreateWalletAsync(UserId);
        var otherWalletId = await CreateWalletAsync(UserId, "Epargne");

        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 2)));
        await _transactionService.CreateTransactionAsync(
            UserId,
            new TransactionCreateDto(TransactionType.Income, 2200f, "salary", new DateTime(2026, 6, 1), "Salaire", walletId));
        await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(otherWalletId, category: "food", date: new DateTime(2026, 7, 5)));

        var incomes = await _transactionService.GetTransactionsAsync(UserId, type: TransactionType.Income);
        incomes.Should().ContainSingle().Which.Type.Should().Be(TransactionType.Income);

        var groceries = await _transactionService.GetTransactionsAsync(UserId, category: "food");
        groceries.Should().ContainSingle().Which.WalletId.Should().Be(otherWalletId);

        var onFirstWallet = await _transactionService.GetTransactionsAsync(UserId, walletId: walletId);
        onFirstWallet.Should().HaveCount(2);

        var june = await _transactionService.GetTransactionsAsync(
            UserId, from: new DateTime(2026, 6, 1), to: new DateTime(2026, 6, 30));
        june.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetTransactions_ShouldOnlyReturnCurrentUserTransactions()
    {
        var ownWalletId = await CreateWalletAsync(UserId);
        var foreignWalletId = await CreateWalletAsync(OtherUserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(ownWalletId));
        await _transactionService.CreateTransactionAsync(OtherUserId, ExpenseDto(foreignWalletId));

        var transactions = await _transactionService.GetTransactionsAsync(UserId);

        transactions.Should().ContainSingle();
        transactions.Should().OnlyContain(t => t.WalletId == ownWalletId);
    }

    [Fact]
    public async Task GetTransactions_WhenSearchMatchesDescription_ShouldBeCaseInsensitive()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 1)));
        await _transactionService.CreateTransactionAsync(
            UserId,
            new TransactionCreateDto(TransactionType.Income, 2200f, "salary", new DateTime(2026, 6, 2), "Salaire", walletId));

        var transactions = await _transactionService.GetTransactionsAsync(UserId, q: "lOYeR");

        transactions.Should().ContainSingle();
        transactions[0].Description.Should().Be("Loyer appartement");
    }

    [Fact]
    public async Task GetTransactions_WhenSearchMatchesCategory_ShouldReturnMatch()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(walletId, category: "food", description: "Courses", date: new DateTime(2026, 6, 1)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 2)));

        var transactions = await _transactionService.GetTransactionsAsync(UserId, q: "FOOD");

        transactions.Should().ContainSingle();
        transactions[0].Category.Should().Be("food");
    }

    [Fact]
    public async Task GetTransactions_WhenSearchMatchesWalletName_ShouldReturnMatch()
    {
        var personnelId = await CreateWalletAsync(UserId);
        var vacancesId = await CreateWalletAsync(UserId, "Vacances");
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(personnelId, date: new DateTime(2026, 6, 1)));
        await _transactionService.CreateTransactionAsync(
            UserId, ExpenseDto(vacancesId, description: "Hotel", date: new DateTime(2026, 6, 2)));

        var transactions = await _transactionService.GetTransactionsAsync(UserId, q: "VACANCES");

        transactions.Should().ContainSingle();
        transactions[0].WalletId.Should().Be(vacancesId);
    }

    [Fact]
    public async Task GetTransactions_WhenSearchMatchesTypeAlias_ShouldReturnOnlyThatType()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 1)));
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 1000f, "gift", new DateTime(2026, 6, 2), "Cadeau", walletId));

        var incomes = await _transactionService.GetTransactionsAsync(UserId, q: "income");
        var expenses = await _transactionService.GetTransactionsAsync(UserId, q: "expense");

        incomes.Should().ContainSingle().Which.Type.Should().Be(TransactionType.Income);
        expenses.Should().ContainSingle().Which.Type.Should().Be(TransactionType.Expense);
    }

    [Fact]
    public async Task GetTransactions_WithOffset_ShouldSkipFirstResults()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 15)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 8)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 1)));

        var firstPage = await _transactionService.GetTransactionsAsync(UserId, limit: 2, offset: 0);
        var secondPage = await _transactionService.GetTransactionsAsync(UserId, limit: 2, offset: 2);

        firstPage.Should().HaveCount(2);
        firstPage[0].Date.Should().Be(new DateTime(2026, 6, 15));
        secondPage.Should().ContainSingle();
        secondPage[0].Date.Should().Be(new DateTime(2026, 6, 1));
    }

    [Fact]
    public async Task GetTransactions_WithNegativeOffset_ShouldClampToZero()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 15)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 8)));

        var transactions = await _transactionService.GetTransactionsAsync(UserId, offset: -5);

        transactions.Should().HaveCount(2);
        transactions[0].Date.Should().Be(new DateTime(2026, 6, 15));
    }

    [Fact]
    public async Task GetTransactions_WithSearchAndOffset_ShouldCombine()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 3)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 2)));
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 500f, "gift", new DateTime(2026, 6, 1), "Cadeau", walletId));

        var page = await _transactionService.GetTransactionsAsync(UserId, limit: 1, offset: 1, q: "loyer");

        page.Should().ContainSingle();
        page[0].Date.Should().Be(new DateTime(2026, 6, 2));
    }

    [Fact]
    public async Task GetTransactions_WithSearch_ShouldOnlyReturnCurrentUserTransactions()
    {
        var ownWalletId = await CreateWalletAsync(UserId);
        var foreignWalletId = await CreateWalletAsync(OtherUserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(ownWalletId));
        await _transactionService.CreateTransactionAsync(OtherUserId, ExpenseDto(foreignWalletId));

        var transactions = await _transactionService.GetTransactionsAsync(UserId, q: "loyer");

        transactions.Should().ContainSingle().Which.WalletId.Should().Be(ownWalletId);
    }

    [Fact]
    public async Task GetTransaction_BelongingToAnotherUser_ShouldReturnNotFound()
    {
        var foreignWalletId = await CreateWalletAsync(OtherUserId);
        var created = await _transactionService.CreateTransactionAsync(
            OtherUserId, ExpenseDto(foreignWalletId));

        var result = await _transactionService.GetTransactionAsync(UserId, created.Transaction!.Id);

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeTrue();
        result.Error.Should().Be("Transaction introuvable.");
    }

    [Fact]
    public async Task Update_ShouldModifyTransaction_AndRecalculateTotals()
    {
        var walletId = await CreateWalletAsync(UserId);
        var created = await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId));

        var result = await _transactionService.UpdateTransactionAsync(
            UserId,
            created.Transaction!.Id,
            new TransactionUpdateDto(TransactionType.Income, 100f, "gift", new DateTime(2026, 6, 20), "Cadeau", walletId));

        result.Success.Should().BeTrue();
        result.Transaction!.Type.Should().Be(TransactionType.Income);
        result.Transaction.Amount.Should().Be(100f);

        var wallet = await _walletService.GetWalletAsync(UserId, walletId);
        wallet.Wallet!.TotalIncome.Should().Be(100f);
        wallet.Wallet.TotalExpenses.Should().Be(0f);
        wallet.Wallet.Amount.Should().Be(100f);
    }

    [Fact]
    public async Task Update_WithWalletChange_ShouldRecalculateBothWallets()
    {
        var sourceWalletId = await CreateWalletAsync(UserId, "Source");
        var targetWalletId = await CreateWalletAsync(UserId, "Cible");
        var created = await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(sourceWalletId));

        await _transactionService.UpdateTransactionAsync(
            UserId,
            created.Transaction!.Id,
            new TransactionUpdateDto(TransactionType.Expense, 650f, "rent", ReferenceDate, "Loyer", targetWalletId));

        var source = await _walletService.GetWalletAsync(UserId, sourceWalletId);
        var target = await _walletService.GetWalletAsync(UserId, targetWalletId);

        source.Wallet!.Amount.Should().Be(0f);
        source.Wallet.TotalExpenses.Should().Be(0f);
        target.Wallet!.Amount.Should().Be(-650f);
        target.Wallet.TotalExpenses.Should().Be(650f);
    }

    [Fact]
    public async Task Update_WithWalletOfAnotherUser_ShouldReturnNotFound()
    {
        var walletId = await CreateWalletAsync(UserId);
        var foreignWalletId = await CreateWalletAsync(OtherUserId);
        var created = await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId));

        var result = await _transactionService.UpdateTransactionAsync(
            UserId,
            created.Transaction!.Id,
            new TransactionUpdateDto(TransactionType.Expense, 10f, "food", ReferenceDate, null, foreignWalletId));

        result.NotFound.Should().BeTrue();
        result.Error.Should().Be("Portefeuille introuvable.");
    }

    [Fact]
    public async Task Update_BelongingToAnotherUser_ShouldReturnNotFound_AndKeepDataIntact()
    {
        var walletId = await CreateWalletAsync(UserId);
        var created = await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId));

        var result = await _transactionService.UpdateTransactionAsync(
            OtherUserId,
            created.Transaction!.Id,
            new TransactionUpdateDto(TransactionType.Income, 9999f, "gift", ReferenceDate, null, walletId));

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeTrue();

        var intact = await _transactionService.GetTransactionAsync(UserId, created.Transaction.Id);
        intact.Transaction!.Type.Should().Be(TransactionType.Expense);
        intact.Transaction.Amount.Should().Be(650f);
    }

    [Fact]
    public async Task Delete_ShouldRemoveTransaction_AndRecalculateTotals()
    {
        var walletId = await CreateWalletAsync(UserId);
        var created = await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId));

        var result = await _transactionService.DeleteTransactionAsync(UserId, created.Transaction!.Id);

        result.Success.Should().BeTrue();
        (await _transactionService.GetTransactionsAsync(UserId)).Should().BeEmpty();

        var wallet = await _walletService.GetWalletAsync(UserId, walletId);
        wallet.Wallet!.Amount.Should().Be(0f);
        wallet.Wallet.TotalExpenses.Should().Be(0f);
    }

    [Fact]
    public async Task Delete_BelongingToAnotherUser_ShouldReturnNotFound_AndKeepDataIntact()
    {
        var walletId = await CreateWalletAsync(UserId);
        var created = await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId));

        var result = await _transactionService.DeleteTransactionAsync(OtherUserId, created.Transaction!.Id);

        result.NotFound.Should().BeTrue();
        (await _transactionService.GetTransactionsAsync(UserId)).Should().ContainSingle();
    }

    [Fact]
    public async Task GetSummary_ShouldAggregateIncomeAndExpenses()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(
            UserId,
            new TransactionCreateDto(TransactionType.Income, 2745f, "salary", new DateTime(2026, 6, 1), null, walletId));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId));

        var summary = await _transactionService.GetSummaryAsync(UserId);

        summary.TotalIncome.Should().Be(2745f);
        summary.TotalExpenses.Should().Be(650f);
        summary.Balance.Should().BeApproximately(2095f, 0.01f);
    }

    [Fact]
    public async Task GetSummary_WithPeriod_ShouldOnlyAggregateThatPeriod()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: new DateTime(2026, 6, 2)));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, amount: 30f, date: new DateTime(2026, 7, 5)));

        var june = await _transactionService.GetSummaryAsync(
            UserId, from: new DateTime(2026, 6, 1), to: new DateTime(2026, 6, 30));

        june.TotalExpenses.Should().Be(650f);
        june.Balance.Should().Be(-650f);
    }

    [Fact]
    public async Task GetSummary_WithoutTransactions_ShouldReturnZeros()
    {
        var summary = await _transactionService.GetSummaryAsync(UserId);

        summary.TotalIncome.Should().Be(0f);
        summary.TotalExpenses.Should().Be(0f);
        summary.Balance.Should().Be(0f);
    }

    [Fact]
    public async Task GetMonthlyStats_ShouldAggregateByMonthAndType()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 1000f, "salary", MonthDate(0, 5), null, walletId));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: MonthDate(0, 10)));
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 500f, "gift", MonthDate(1, 20), null, walletId));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, amount: 300f, date: MonthDate(1, 15)));

        var stats = await _transactionService.GetMonthlyStatsAsync(UserId, months: 2);

        stats.Should().HaveCount(2);
        stats[0].Period.Should().Be(PeriodOf(1));
        stats[0].Income.Should().Be(500f);
        stats[0].Expenses.Should().Be(300f);
        stats[1].Period.Should().Be(PeriodOf(0));
        stats[1].Income.Should().Be(1000f);
        stats[1].Expenses.Should().Be(650f);
    }

    [Fact]
    public async Task GetMonthlyStats_ShouldZeroFillEmptyMonths_InAscendingOrder()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletId, date: MonthDate(0, 10)));

        var stats = await _transactionService.GetMonthlyStatsAsync(UserId, months: 6);

        stats.Should().HaveCount(6);
        stats.Select(s => s.Period).Should().BeInAscendingOrder();
        stats.Take(5).Should().OnlyContain(s => s.Income == 0f && s.Expenses == 0f);
        stats[^1].Expenses.Should().Be(650f);
    }

    [Fact]
    public async Task GetMonthlyStats_ShouldOnlyAggregateSelectedWallet()
    {
        var walletA = await CreateWalletAsync(UserId, "Revenus");
        var walletB = await CreateWalletAsync(UserId, "Dépenses");
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 1000f, "salary", MonthDate(0, 5), null, walletA));
        await _transactionService.CreateTransactionAsync(UserId, ExpenseDto(walletB, amount: 100f, date: MonthDate(0, 6)));

        var statsA = await _transactionService.GetMonthlyStatsAsync(UserId, walletId: walletA, months: 1);
        var statsB = await _transactionService.GetMonthlyStatsAsync(UserId, walletId: walletB, months: 1);
        var statsAll = await _transactionService.GetMonthlyStatsAsync(UserId, months: 1);

        statsA[^1].Income.Should().Be(1000f);
        statsA[^1].Expenses.Should().Be(0f);
        statsB[^1].Income.Should().Be(0f);
        statsB[^1].Expenses.Should().Be(100f);
        statsAll[^1].Income.Should().Be(1000f);
        statsAll[^1].Expenses.Should().Be(100f);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(999, 36)]
    public async Task GetMonthlyStats_ShouldClampRequestedMonths(int months, int expectedCount)
    {
        var stats = await _transactionService.GetMonthlyStatsAsync(UserId, months: months);

        stats.Should().HaveCount(expectedCount);
    }

    [Fact]
    public async Task GetMonthlyStats_WithoutMonths_ShouldDefaultToTwelveBuckets()
    {
        var stats = await _transactionService.GetMonthlyStatsAsync(UserId);

        stats.Should().HaveCount(TransactionService.DefaultMonthlyRange);
    }

    [Fact]
    public async Task GetMonthlyStats_ShouldExcludeOlderAndFutureTransactions()
    {
        var walletId = await CreateWalletAsync(UserId);
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 999f, "old", MonthDate(7, 10), null, walletId));
        await _transactionService.CreateTransactionAsync(
            UserId, new TransactionCreateDto(TransactionType.Income, 888f, "future", MonthDate(-2, 10), null, walletId));

        var stats = await _transactionService.GetMonthlyStatsAsync(UserId, months: 6);

        stats.Should().HaveCount(6);
        stats.Should().OnlyContain(s => s.Income == 0f && s.Expenses == 0f);
    }

    [Fact]
    public async Task GetMonthlyStats_ShouldOnlyAggregateCurrentUserTransactions()
    {
        var otherWalletId = await CreateWalletAsync(OtherUserId, "Autrui");
        await _transactionService.CreateTransactionAsync(OtherUserId, ExpenseDto(otherWalletId, date: MonthDate(0, 5)));

        var stats = await _transactionService.GetMonthlyStatsAsync(UserId, months: 1);

        stats.Should().ContainSingle();
        stats.Should().OnlyContain(s => s.Income == 0f && s.Expenses == 0f);
    }

    private static DateTime MonthDate(int monthsAgo, int day) =>
        new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1)
            .AddMonths(-monthsAgo)
            .AddDays(day - 1);

    private static string PeriodOf(int monthsAgo)
    {
        var month = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1).AddMonths(-monthsAgo);
        return $"{month.Year:D4}-{month.Month:D2}";
    }

    private async Task<int> CreateWalletAsync(int userId, string name = "Personnel")
    {
        var result = await _walletService.CreateWalletAsync(userId, new WalletCreateDto(name));
        result.Success.Should().BeTrue();
        return result.Wallet!.Id;
    }

    private static TransactionCreateDto ExpenseDto(
        int walletId,
        float amount = 650f,
        DateTime? date = null,
        string? category = "rent",
        string? description = "Loyer appartement") =>
        new(TransactionType.Expense, amount, category, date ?? ReferenceDate, description, walletId);
}
