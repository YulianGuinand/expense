using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Models;
using backend.Data;
using backend.Services;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;

    public AuthController(AppDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    [HttpPost("register")]
    public IActionResult Register(UserRegisterDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Tous les champs sont obligatoires." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (_context.Users.Any(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest(new { message = "Un utilisateur avec cet email existe déjà." });
        }

        var user = new User
        {
            Email = normalizedEmail,
            Username = request.Username.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "User"
        };

        _context.Users.Add(user);
        _context.Wallets.Add(new Wallet
        {
            User = user,
            Name = WalletService.DefaultWalletName
        });
        _context.SaveChanges();

        var token = _authService.GenerateJwtToken(user);
        var userDto = new UserResponseDto(user.Id, user.Username, user.Email, user.Role);

        return Ok(new AuthResponseDto(token, userDto));
    }

    [HttpPost("login")]
    public IActionResult Login(UserLoginDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email et mot de passe requis." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Identifiants invalides." });
        }

        var token = _authService.GenerateJwtToken(user);
        var userDto = new UserResponseDto(user.Id, user.Username, user.Email, user.Role);

        return Ok(new AuthResponseDto(token, userDto));
    }
}