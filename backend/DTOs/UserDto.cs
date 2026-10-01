namespace backend.DTOs;

public record UserRegisterDto(string Username, string Email, string Password);
public record UserLoginDto(string Email, string Password);