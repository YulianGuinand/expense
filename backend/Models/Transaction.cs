namespace backend.Models;

public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int WalletId { get; set; }
    public Wallet? Wallet { get; set; }
    public TransactionType Type { get; set; }
    public float Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
}
