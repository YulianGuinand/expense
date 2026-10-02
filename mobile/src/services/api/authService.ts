import { apiClient } from "./apiClient";
import {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UpdateUserCredentials,
} from "@/types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/Auth/login", credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/Auth/register", credentials);
    return response.data;
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/User/me");
    return response.data;
  },

  async updateUsername(credentials: UpdateUserCredentials): Promise<AuthUser> {
    const response = await apiClient.put<AuthUser>("/User/me", credentials);
    return response.data;
  },
};
