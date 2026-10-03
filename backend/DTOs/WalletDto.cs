namespace backend.DTOs;

public record WalletCreateDto(string Name);
public record WalletUpdateDto(string Name);
public record WalletResponseDto(int Id, string Name, float Amount, float TotalIncome, float TotalExpenses);
