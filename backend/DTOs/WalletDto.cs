namespace backend.DTOs;

public record WalletCreateDto(string Name, float? Goal = null);
public record WalletUpdateDto(string Name, float? Goal = null);
public record WalletResponseDto(int Id, string Name, float Amount, float TotalIncome, float TotalExpenses, float? Goal = null);
