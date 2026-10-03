using backend.Models;

namespace backend.DTOs;

public record TransactionCreateDto(TransactionType Type, float Amount, string? Category, DateTime Date, string? Description, int WalletId);

public record TransactionUpdateDto(TransactionType Type, float Amount, string? Category, DateTime Date, string? Description, int WalletId);

public record TransactionResponseDto(int Id, TransactionType Type, float Amount, string? Category, DateTime Date, string? Description, int WalletId);

public record TransactionSummaryDto(float TotalIncome, float TotalExpenses, float Balance);

public record TransactionMonthlyDto(string Period, float Income, float Expenses);
