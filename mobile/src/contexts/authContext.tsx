import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ApiResult,
  AuthContextType,
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/types";
import { authService } from "@/services/api/authService";
import { extractApiErrorMessage, setUnauthorizedCallback } from "@/services/api/apiClient";
import { queryClient } from "@/services/query/queryClient";
import { tokenStorage } from "@/services/storage/tokenStorage";

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false, msg: "Contexte non initialisé" }),
  register: async () => ({ success: false, msg: "Contexte non initialisé" }),
  logout: async () => ({ success: false }),
  updateUsername: async () => ({ success: false, msg: "Contexte non initialisé" }),
  refreshUserProfile: async () => ({ success: false, msg: "Contexte non initialisé" }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronisation de deconnexion en cas de reponse 401 sur un appel API
  const handleUnauthorized = useCallback(() => {
    queryClient.clear();
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(handleUnauthorized);
    return () => {
      setUnauthorizedCallback(null);
    };
  }, [handleUnauthorized]);

  // Chargement initial de la session securisee
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        const storedUser = await tokenStorage.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Verification en arriere-plan de la validite du jeton aupres du backend
          try {
            const freshUser = await authService.getMe();
            setUser(freshUser);
            await tokenStorage.setUser(freshUser);
          } catch {
            // Si le jeton est expire (401), l'intercepteur declenche handleUnauthorized
          }
        }
      } catch (error) {
        console.error("Erreur d'initialisation de la session :", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<ApiResult<AuthResponse>> => {
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);

      await Promise.all([
        tokenStorage.setToken(response.token),
        tokenStorage.setUser(response.user),
      ]);

      return { success: true, data: response };
    } catch (error) {
      const msg = extractApiErrorMessage(error, "Échec de connexion. Vérifiez vos identifiants.");
      return { success: false, msg };
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<ApiResult<AuthResponse>> => {
    try {
      const response = await authService.register(credentials);
      setToken(response.token);
      setUser(response.user);

      await Promise.all([
        tokenStorage.setToken(response.token),
        tokenStorage.setUser(response.user),
      ]);

      return { success: true, data: response };
    } catch (error) {
      const msg = extractApiErrorMessage(error, "Échec de l'inscription.");
      return { success: false, msg };
    }
  }, []);

  const logout = useCallback(async (): Promise<ApiResult> => {
    try {
      queryClient.clear();
      setUser(null);
      setToken(null);
      await tokenStorage.clearSession();
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      return { success: false, msg: "Erreur lors de la déconnexion." };
    }
  }, []);

  const updateUsername = useCallback(async (newUsername: string): Promise<ApiResult<AuthUser>> => {
    try {
      const updatedUser = await authService.updateUsername({ username: newUsername });
      setUser(updatedUser);
      await tokenStorage.setUser(updatedUser);
      return { success: true, data: updatedUser };
    } catch (error) {
      const msg = extractApiErrorMessage(error, "Impossible de mettre à jour le profil.");
      return { success: false, msg };
    }
  }, []);

  const refreshUserProfile = useCallback(async (): Promise<ApiResult<AuthUser>> => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      await tokenStorage.setUser(freshUser);
      return { success: true, data: freshUser };
    } catch (error) {
      const msg = extractApiErrorMessage(error, "Impossible d'actualiser le profil.");
      return { success: false, msg };
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateUsername,
      refreshUserProfile,
    }),
    [user, token, isLoading, login, register, logout, updateUsername, refreshUserProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
