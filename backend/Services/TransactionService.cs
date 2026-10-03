using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Services;

public record TransactionResult(bool Success, string? Error, TransactionResponseDto? Transaction, bool NotFound = false)
{
    public static TransactionResult Ok(TransactionResponseDto transaction) => new(true, null, transaction);
    public static TransactionResult Invalid(string error) => new(false, error, null);
    public static TransactionResult Missing() => new(false, "Portefeuille introuvable.", null, NotFound: true);
    public static TransactionResult MissingTransaction() => new(false, "Transaction introuvable.", null, NotFound: true);
}

public class TransactionService
{
    public const int MaxCategoryLength = 50;
    public const int MaxDescriptionLength = 200;
    public const int MaxResultLimit = 100;

    private readonly AppDbContext _context;

    public TransactionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TransactionResponseDto>> GetTransactionsAsync(
        int userId,
        int? walletId = null,
        TransactionType? type = null,
        string? category = null,
        DateTime? from = null,
        DateTime? to = null,
        int? limit = null)
    {
        var query = _context.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId);

        if (walletId.HasValue)
        {
            query = query.Where(t => t.WalletId == walletId.Value);
        }

        if (type.HasValue)
        {
            query = query.Where(t => t.Type == type.Value);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var categoryFilter = category.Trim();
            query = query.Where(t => t.Category == categoryFilter);
        }

        if (from.HasValue)
        {
            query = query.Where(t => t.Date >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(t => t.Date <= to.Value);
        }

        var take = limit.HasValue ? Math.Clamp(limit.Value, 1, MaxResultLimit) : MaxResultLimit;

        var transactions = await query
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .Take(take)
            .ToListAsync();

        return transactions.Select(ToDto).ToList();
    }

    public async Task<TransactionResult> GetTransactionAsync(int userId, int transactionId)
    {
        var transaction = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        return transaction == null
            ? TransactionResult.MissingTransaction()
            : TransactionResult.Ok(ToDto(transaction));
    }

    public async Task<TransactionResult> CreateTransactionAsync(int userId, TransactionCreateDto request)
    {
        var validationError = Validate(request.Type, request.Amount, request.Category, request.Date, request.Description);
        if (validationError != null)
        {
            return TransactionResult.Invalid(validationError);
        }

        var walletExists = await _context.Wallets
            .AnyAsync(w => w.Id == request.WalletId && w.UserId == userId);
        if (!walletExists)
        {
            return TransactionResult.Missing();
        }

        var transaction = new Transaction
        {
            UserId = userId,
            WalletId = request.WalletId,
            Type = request.Type,
            Amount = request.Amount,
            Category = Normalize(request.Category),
            Date = request.Date,
            Description = Normalize(request.Description)
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        await RecalculateWalletAsync(userId, transaction.WalletId);
        await _context.SaveChangesAsync();

        return TransactionResult.Ok(ToDto(transaction));
    }

    public async Task<TransactionResult> UpdateTransactionAsync(int userId, int transactionId, TransactionUpdateDto request)
    {
        var validationError = Validate(request.Type, request.Amount, request.Category, request.Date, request.Description);
        if (validationError != null)
        {
            return TransactionResult.Invalid(validationError);
        }

        var walletExists = await _context.Wallets
            .AnyAsync(w => w.Id == request.WalletId && w.UserId == userId);
        if (!walletExists)
        {
            return TransactionResult.Missing();
        }

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        if (transaction == null)
        {
            return TransactionResult.MissingTransaction();
        }

        var previousWalletId = transaction.WalletId;

        transaction.Type = request.Type;
        transaction.Amount = request.Amount;
        transaction.Category = Normalize(request.Category);
        transaction.Date = request.Date;
        transaction.Description = Normalize(request.Description);
        transaction.WalletId = request.WalletId;

        await _context.SaveChangesAsync();

        await RecalculateWalletAsync(userId, previousWalletId);
        if (previousWalletId != transaction.WalletId)
        {
            await RecalculateWalletAsync(userId, transaction.WalletId);
        }
        await _context.SaveChangesAsync();

        return TransactionResult.Ok(ToDto(transaction));
    }

    public async Task<TransactionResult> DeleteTransactionAsync(int userId, int transactionId)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        if (transaction == null)
        {
            return TransactionResult.MissingTransaction();
        }

        var walletId = transaction.WalletId;

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();

        await RecalculateWalletAsync(userId, walletId);
        await _context.SaveChangesAsync();

        return TransactionResult.Ok(ToDto(transaction));
    }

    public async Task<TransactionSummaryDto> GetSummaryAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var query = _context.Transactions.Where(t => t.UserId == userId);

        if (from.HasValue)
        {
            query = query.Where(t => t.Date >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(t => t.Date <= to.Value);
        }

        var totalIncome = await query
            .Where(t => t.Type == TransactionType.Income)
            .SumAsync(t => t.Amount);

        var totalExpenses = await query
            .Where(t => t.Type == TransactionType.Expense)
            .SumAsync(t => t.Amount);

        return new TransactionSummaryDto(totalIncome, totalExpenses, totalIncome - totalExpenses);
    }

    private async Task RecalculateWalletAsync(int userId, int walletId)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == userId);

        if (wallet == null)
        {
            return;
        }

        var sumsByType = await _context.Transactions
            .Where(t => t.WalletId == walletId)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync();

        var income = sumsByType
            .Where(x => x.Type == TransactionType.Income)
            .Sum(x => x.Total);
        var expenses = sumsByType
            .Where(x => x.Type == TransactionType.Expense)
            .Sum(x => x.Total);

        wallet.TotalIncome = income;
        wallet.TotalExpenses = expenses;
        wallet.Amount = income - expenses;
    }

    private static string? Validate(TransactionType type, float amount, string? category, DateTime date, string? description)
    {
        if (!Enum.IsDefined(type))
        {
            return "Le type de transaction est invalide.";
        }

        if (amount <= 0)
        {
            return "Le montant doit être supérieur à 0.";
        }

        if (date == default)
        {
            return "La date de transaction est requise.";
        }

        if (category != null && category.Trim().Length > MaxCategoryLength)
        {
            return $"La catégorie ne peut pas dépasser {MaxCategoryLength} caractères.";
        }

        if (description != null && description.Trim().Length > MaxDescriptionLength)
        {
            return $"La description ne peut pas dépasser {MaxDescriptionLength} caractères.";
        }

        return null;
    }

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static TransactionResponseDto ToDto(Transaction transaction) =>
        new(
            transaction.Id,
            transaction.Type,
            transaction.Amount,
            string.IsNullOrEmpty(transaction.Category) ? null : transaction.Category,
            transaction.Date,
            string.IsNullOrEmpty(transaction.Description) ? null : transaction.Description,
            transaction.WalletId);
}
