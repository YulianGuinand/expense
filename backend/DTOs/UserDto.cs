namespace backend.DTOs;

public record UserRegisterDto(string Username, string Email, string Password);
public record UserLoginDto(string Email, string Password);
public record UserResponseDto(int Id, string Username, string Email, string Role);
public record AuthResponseDto(string Token, UserResponseDto User);
public record UpdateUserDto(string Username);