using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Data;

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