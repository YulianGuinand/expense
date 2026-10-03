using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Services;

public record WalletResult(bool Success, string? Error, WalletResponseDto? Wallet, bool NotFound = false)
{
    public static WalletResult Ok(WalletResponseDto wallet) => new(true, null, wallet);
    public static WalletResult Invalid(string error) => new(false, error, null);
    public static WalletResult Missing() => new(false, "Portefeuille introuvable.", null, NotFound: true);
}

public class WalletService
{
    public const int MaxNameLength = 100;
    public const string DefaultWalletName = "01. Personnel";

    private readonly AppDbContext _context;

    public WalletService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<WalletResponseDto>> GetWalletsAsync(int userId)
    {
        var wallets = await _context.Wallets
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.Name)
            .ToListAsync();

        return wallets.Select(ToDto).ToList();
    }

    public async Task<WalletResult> GetWalletAsync(int userId, int walletId)
    {
        var wallet = await _context.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == userId);

        return wallet == null ? WalletResult.Missing() : WalletResult.Ok(ToDto(wallet));
    }

    public async Task<WalletResult> CreateWalletAsync(int userId, WalletCreateDto request)
    {
        var nameError = ValidateName(request.Name);
        if (nameError != null)
        {
            return WalletResult.Invalid(nameError);
        }

        var wallet = new Wallet
        {
            UserId = userId,
            Name = request.Name.Trim()
        };

        _context.Wallets.Add(wallet);
        await _context.SaveChangesAsync();

        return WalletResult.Ok(ToDto(wallet));
    }

    public async Task<WalletResult> UpdateWalletAsync(int userId, int walletId, WalletUpdateDto request)
    {
        var nameError = ValidateName(request.Name);
        if (nameError != null)
        {
            return WalletResult.Invalid(nameError);
        }

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == userId);

        if (wallet == null)
        {
            return WalletResult.Missing();
        }

        wallet.Name = request.Name.Trim();
        await _context.SaveChangesAsync();

        return WalletResult.Ok(ToDto(wallet));
    }

    public async Task<WalletResult> DeleteWalletAsync(int userId, int walletId)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == userId);

        if (wallet == null)
        {
            return WalletResult.Missing();
        }

        var transactions = await _context.Transactions
            .Where(t => t.WalletId == walletId && t.UserId == userId)
            .ToListAsync();

        _context.Transactions.RemoveRange(transactions);
        _context.Wallets.Remove(wallet);
        await _context.SaveChangesAsync();

        return WalletResult.Ok(ToDto(wallet));
    }

    private static string? ValidateName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return "Le nom du portefeuille est requis.";
        }

        if (name.Trim().Length > MaxNameLength)
        {
            return $"Le nom du portefeuille ne peut pas dépasser {MaxNameLength} caractères.";
        }

        return null;
    }

    private static WalletResponseDto ToDto(Wallet wallet) =>
        new(wallet.Id, wallet.Name, wallet.Amount, wallet.TotalIncome, wallet.TotalExpenses);
}
