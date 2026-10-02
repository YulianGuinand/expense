namespace backend.Models;

public class Wallet
{
    public int Id { get; set; }
    public User User { get; set; } = new User();
    public string Name {get; set;} = string.Empty;
    public float Amount {get; set;}
    public float TotalIncome {get; set;}
    public float TotalExpenses {get; set;}
}