import * as SecureStore from "expo-secure-store";
import { AuthUser } from "@/types";

const TOKEN_KEY = "expense_auth_token";
const USER_KEY = "expense_auth_user";

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Erreur lors de la lecture du token SecureStore:", error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du token SecureStore:", error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Erreur lors de la suppression du token SecureStore:", error);
    }
  },

  async getUser(): Promise<AuthUser | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_KEY);
      if (!data) return null;
      return JSON.parse(data) as AuthUser;
    } catch (error) {
      console.error("Erreur lors de la lecture de l'utilisateur SecureStore:", error);
      return null;
    }
  },

  async setUser(user: AuthUser): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'utilisateur SecureStore:", error);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur SecureStore:", error);
    }
  },

  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de la session SecureStore:", error);
    }
  },
};
