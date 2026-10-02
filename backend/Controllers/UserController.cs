using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == email.ToLower());
        if (user == null)
        {
            return NotFound(new { message = "Utilisateur introuvable." });
        }

        return Ok(new UserResponseDto(user.Id, user.Username, user.Email, user.Role));
    }

    [HttpPut("me")]
    [Authorize]
    public IActionResult UpdateCurrentUser([FromBody] UpdateUserDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new { message = "Le nom d'utilisateur ne peut pas être vide." });
        }

        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == email.ToLower());
        if (user == null)
        {
            return NotFound(new { message = "Utilisateur introuvable." });
        }

        user.Username = request.Username.Trim();
        _context.SaveChanges();

        return Ok(new UserResponseDto(user.Id, user.Username, user.Email, user.Role));
    }

    [HttpGet]
    [Authorize] 
    public IActionResult GetAllUsers()
    {
        var users = _context.Users.Select(u => new 
        {
            u.Id,
            u.Username,
            u.Email,
            u.Role
        }).ToList();

        return Ok(users);
    }

    [HttpGet("admin-only")]
    [Authorize(Roles = "Admin")]
    public IActionResult AdminDashboard()
    {
        return Ok(new { message = "Bienvenue dans l'espace Administrateur !" });
    }
}