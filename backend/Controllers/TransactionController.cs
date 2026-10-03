using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TransactionController : ControllerBase
{
    private readonly TransactionService _transactionService;

    public TransactionController(TransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllTransactionsOfUser(
        [FromQuery] int? walletId,
        [FromQuery] TransactionType? type,
        [FromQuery] string? category,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? limit,
        [FromQuery] string? q,
        [FromQuery] int? offset)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var transactions = await _transactionService.GetTransactionsAsync(
            userId.Value, walletId, type, category, from, to, limit, q, offset);

        return Ok(transactions);
    }

    [HttpGet("summary")]
    [Authorize]
    public async Task<IActionResult> GetTransactionsSummary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var summary = await _transactionService.GetSummaryAsync(userId.Value, from, to);
        return Ok(summary);
    }

    [HttpGet("monthly")]
    [Authorize]
    public async Task<IActionResult> GetMonthlyStats(
        [FromQuery] int? walletId,
        [FromQuery] int? months)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifiǸ." });
        }

        var stats = await _transactionService.GetMonthlyStatsAsync(userId.Value, walletId, months);
        return Ok(stats);
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetTransactionById(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _transactionService.GetTransactionAsync(userId.Value, id);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return Ok(result.Transaction);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateTransaction([FromBody] TransactionCreateDto request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _transactionService.CreateTransactionAsync(userId.Value, request);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return CreatedAtAction(nameof(GetTransactionById), new { id = result.Transaction!.Id }, result.Transaction);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> UpdateTransaction(int id, [FromBody] TransactionUpdateDto request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _transactionService.UpdateTransactionAsync(userId.Value, id, request);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return Ok(result.Transaction);
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Utilisateur non identifié." });
        }

        var result = await _transactionService.DeleteTransactionAsync(userId.Value, id);
        if (!result.Success)
        {
            return MapFailure(result);
        }

        return Ok(new { message = "Transaction supprimée." });
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var userId) ? userId : null;
    }

    private IActionResult MapFailure(TransactionResult result)
    {
        return result.NotFound
            ? NotFound(new { message = result.Error })
            : BadRequest(new { message = result.Error });
    }
}
