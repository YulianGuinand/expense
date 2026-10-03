using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class WalletController : ControllerBase
{
    private readonly WalletService _walletService;

    public WalletController(WalletService walletService)
    {
        _walletService = walletService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllWalletsOfUser()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var wallets = await _walletService.GetWalletsAsync(userId.Value);
        return Ok(wallets);
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetWalletById(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _walletService.GetWalletAsync(userId.Value, id);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return Ok(result.Wallet);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateWallet([FromBody] WalletCreateDto request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _walletService.CreateWalletAsync(userId.Value, request);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return CreatedAtAction(nameof(GetWalletById), new { id = result.Wallet!.Id }, result.Wallet);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> UpdateWallet(int id, [FromBody] WalletUpdateDto request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _walletService.UpdateWalletAsync(userId.Value, id, request);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return Ok(result.Wallet);
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteWallet(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _walletService.DeleteWalletAsync(userId.Value, id);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return Ok(new { message = "Portefeuille supprimé." });
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var userId) ? userId : null;
    }

    private IActionResult MapFailure(WalletResult result)
    {
        return result.NotFound
            ? NotFound(new { message = result.Error })
            : BadRequest(new { message = result.Error });
    }
}
