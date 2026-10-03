using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Tests.UnitTests;

public class WalletServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly WalletService _walletService;

    private const int UserId = 1;
    private const int OtherUserId = 2;

    public WalletServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"wallet-service-tests-{Guid.NewGuid()}")
            .Options;

        _context = new AppDbContext(options);
        _walletService = new WalletService(_context);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task CreateWallet_WithValidName_ShouldSucceed_WithZeroAmounts()
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Livret A"));

        result.Success.Should().BeTrue();
        result.Error.Should().BeNull();
        result.Wallet.Should().NotBeNull();
        result.Wallet!.Id.Should().BeGreaterThan(0);
        result.Wallet.Name.Should().Be("Livret A");
        result.Wallet.Amount.Should().Be(0);
        result.Wallet.TotalIncome.Should().Be(0);
        result.Wallet.TotalExpenses.Should().Be(0);
    }

    [Fact]
    public async Task CreateWallet_ShouldTrimName()
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("  Epargne  "));

        result.Success.Should().BeTrue();
        result.Wallet!.Name.Should().Be("Epargne");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateWallet_WithBlankName_ShouldFail(string? name)
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto(name!));

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeFalse();
        result.Error.Should().Be("Le nom du portefeuille est requis.");
    }

    [Fact]
    public async Task CreateWallet_WithTooLongName_ShouldFail()
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto(new string('a', 101)));

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("100 caractères");
    }

    [Fact]
    public async Task GetWallets_ShouldOnlyReturnCurrentUserWallets()
    {
        await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Portefeuille A1"));
        await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Portefeuille A2"));
        await _walletService.CreateWalletAsync(OtherUserId, new WalletCreateDto("Portefeuille B1"));

        var wallets = await _walletService.GetWalletsAsync(UserId);

        wallets.Should().HaveCount(2);
        wallets.Should().OnlyContain(w => w.Name.StartsWith("Portefeuille A"));
    }

    [Fact]
    public async Task GetWallet_WithOwnWallet_ShouldSucceed()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Personnel"));

        var result = await _walletService.GetWalletAsync(UserId, created.Wallet!.Id);

        result.Success.Should().BeTrue();
        result.Wallet!.Name.Should().Be("Personnel");
    }

    [Fact]
    public async Task GetWallet_BelongingToAnotherUser_ShouldReturnNotFound()
    {
        var created = await _walletService.CreateWalletAsync(OtherUserId, new WalletCreateDto("Sensible"));

        var result = await _walletService.GetWalletAsync(UserId, created.Wallet!.Id);

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeTrue();
        result.Error.Should().Be("Portefeuille introuvable.");
    }

    [Fact]
    public async Task GetWallet_WithUnknownId_ShouldReturnNotFound()
    {
        var result = await _walletService.GetWalletAsync(UserId, 9999);

        result.NotFound.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateWallet_ShouldRenameOwnedWallet()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Ancien nom"));

        var result = await _walletService.UpdateWalletAsync(UserId, created.Wallet!.Id, new WalletUpdateDto("Nouveau nom"));

        result.Success.Should().BeTrue();
        result.Wallet!.Name.Should().Be("Nouveau nom");

        var reloaded = await _walletService.GetWalletAsync(UserId, created.Wallet.Id);
        reloaded.Wallet!.Name.Should().Be("Nouveau nom");
    }

    [Fact]
    public async Task UpdateWallet_WithBlankName_ShouldFail_WithoutChangingWallet()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Valide"));

        var result = await _walletService.UpdateWalletAsync(UserId, created.Wallet!.Id, new WalletUpdateDto("  "));

        result.Success.Should().BeFalse();

        var reloaded = await _walletService.GetWalletAsync(UserId, created.Wallet.Id);
        reloaded.Wallet!.Name.Should().Be("Valide");
    }

    [Fact]
    public async Task UpdateWallet_BelongingToAnotherUser_ShouldReturnNotFound()
    {
        var created = await _walletService.CreateWalletAsync(OtherUserId, new WalletCreateDto("Autrui"));

        var result = await _walletService.UpdateWalletAsync(UserId, created.Wallet!.Id, new WalletUpdateDto("Piratage"));

        result.NotFound.Should().BeTrue();

        var ownerView = await _walletService.GetWalletAsync(OtherUserId, created.Wallet.Id);
        ownerView.Wallet!.Name.Should().Be("Autrui");
    }

    [Fact]
    public async Task DeleteWallet_ShouldRemoveOwnedWallet()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("A supprimer"));

        var result = await _walletService.DeleteWalletAsync(UserId, created.Wallet!.Id);

        result.Success.Should().BeTrue();

        var afterDeletion = await _walletService.GetWalletAsync(UserId, created.Wallet.Id);
        afterDeletion.NotFound.Should().BeTrue();
        (await _walletService.GetWalletsAsync(UserId)).Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteWallet_BelongingToAnotherUser_ShouldReturnNotFound()
    {
        var created = await _walletService.CreateWalletAsync(OtherUserId, new WalletCreateDto("Intact"));

        var result = await _walletService.DeleteWalletAsync(UserId, created.Wallet!.Id);

        result.NotFound.Should().BeTrue();
        (await _walletService.GetWalletsAsync(OtherUserId)).Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateWallet_ShouldPersistWalletForItsOwnerOnly()
    {
        await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Secret"));

        var otherWallets = await _walletService.GetWalletsAsync(OtherUserId);

        otherWallets.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteWallet_ShouldRemoveLinkedTransactions()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("A supprimer"));
        var transactionService = new TransactionService(_context);
        await transactionService.CreateTransactionAsync(
            UserId,
            new TransactionCreateDto(TransactionType.Expense, 50f, "food", new DateTime(2026, 6, 3), null, created.Wallet!.Id));

        await _walletService.DeleteWalletAsync(UserId, created.Wallet.Id);

        _context.Transactions.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateWallet_WithGoal_ShouldPersistGoal()
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Épargne", 1000f));

        result.Success.Should().BeTrue();
        result.Wallet!.Goal.Should().Be(1000f);
    }

    [Fact]
    public async Task CreateWallet_WithoutGoal_ShouldHaveNullGoal()
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Sans objectif"));

        result.Success.Should().BeTrue();
        result.Wallet!.Goal.Should().BeNull();
    }

    [Theory]
    [InlineData(0f)]
    [InlineData(-50f)]
    public async Task CreateWallet_WithNonPositiveGoal_ShouldFail(float goal)
    {
        var result = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Épargne", goal));

        result.Success.Should().BeFalse();
        result.NotFound.Should().BeFalse();
        result.Error.Should().Be("L'objectif doit être supérieur à 0.");
    }

    [Fact]
    public async Task UpdateWallet_ShouldSetGoal()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Objectif"));

        var result = await _walletService.UpdateWalletAsync(UserId, created.Wallet!.Id, new WalletUpdateDto("Objectif", 1000f));

        result.Success.Should().BeTrue();
        result.Wallet!.Goal.Should().Be(1000f);

        var reloaded = await _walletService.GetWalletAsync(UserId, created.Wallet.Id);
        reloaded.Wallet!.Goal.Should().Be(1000f);
    }

    [Fact]
    public async Task UpdateWallet_WithoutGoal_ShouldClearGoal()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Objectif", 500f));

        var result = await _walletService.UpdateWalletAsync(UserId, created.Wallet!.Id, new WalletUpdateDto("Objectif"));

        result.Success.Should().BeTrue();
        result.Wallet!.Goal.Should().BeNull();

        var reloaded = await _walletService.GetWalletAsync(UserId, created.Wallet.Id);
        reloaded.Wallet!.Goal.Should().BeNull();
    }

    [Fact]
    public async Task UpdateWallet_WithNonPositiveGoal_ShouldFail_WithoutChangingWallet()
    {
        var created = await _walletService.CreateWalletAsync(UserId, new WalletCreateDto("Objectif", 500f));

        var result = await _walletService.UpdateWalletAsync(UserId, created.Wallet!.Id, new WalletUpdateDto("Objectif", 0f));

        result.Success.Should().BeFalse();
        result.Error.Should().Be("L'objectif doit être supérieur à 0.");

        var reloaded = await _walletService.GetWalletAsync(UserId, created.Wallet.Id);
        reloaded.Wallet!.Goal.Should().Be(500f);
    }
}
