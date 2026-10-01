import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

type LoginType = {
  email: string;
  password: string;
};

interface ProviderProps {
  user: { username: string; email: string } | null;
  token: string | null;
  isLoading: boolean;
  login(data: LoginType): Promise<{ success: boolean }>;
  logout(): Promise<{ success: boolean }>;
  updateUsername(newUsername: string): Promise<{ success: boolean }>;
}

const AuthContext = createContext<ProviderProps>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {
    return { success: false };
  },
  logout: async () => {
    return { success: false };
  },
  updateUsername: async () => {
    return { success: false };
  },
});

export const randomAlphaNumeric = (length: number) => {
  let s = "";
  Array.from({ length }).some(() => {
    s += Math.random().toString(36).slice(2);
    return s.length >= length;
  });
  return s.slice(0, length);
};

const AUTH_STORAGE_KEY = "auth_session";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(
    null,
  );
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
        if (storedSession) {
          const { email, token, username } = JSON.parse(storedSession);
          setUser({ email, username: username || "Yulian" });
          setToken(token);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la session :", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (data: LoginType) => {
    try {
      const t = randomAlphaNumeric(50);
      const username = "Yulian";

      setUser({ email: data.email, username });
      setToken(t);

      const sessionData = JSON.stringify({
        email: data.email,
        token: t,
        username,
      });
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, sessionData);

      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      return { success: false };
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      if (!user || !token) {
        return { success: false };
      }

      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);

      const sessionData = JSON.stringify({
        email: user.email,
        token,
        username: newUsername,
      });
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, sessionData);

      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la modification du nom :", error);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, updateUsername }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};
