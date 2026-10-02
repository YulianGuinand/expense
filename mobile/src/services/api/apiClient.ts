/* eslint-disable import/no-named-as-default-member */
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { tokenStorage } from "../storage/tokenStorage";

const resolveApiBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "Configuration manquante : la variable d'environnement EXPO_PUBLIC_API_URL n'est pas définie. Veuillez créer un fichier .env à la racine du dossier mobile (consultez .env.example).",
    );
  }
  return url.trim();
};

export const API_BASE_URL = resolveApiBaseUrl();

type UnauthorizedHandler = () => void;
let unauthorizedCallback: UnauthorizedHandler | null = null;

export const setUnauthorizedCallback = (
  callback: UnauthorizedHandler | null,
) => {
  unauthorizedCallback = callback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteur de requete : injection automatique du jeton Bearer
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Intercepteur de reponse : session glissante (X-Renewed-Token) et interception 401
apiClient.interceptors.response.use(
  async (response) => {
    // Session glissante : si le serveur renvoie un jeton rafraichi, mise a jour transparente
    const renewedToken =
      response.headers["x-renewed-token"] ||
      response.headers["X-Renewed-Token"];
    if (renewedToken && typeof renewedToken === "string") {
      await tokenStorage.setToken(renewedToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await tokenStorage.clearSession();
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }
    return Promise.reject(error);
  },
);

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "Une erreur est survenue.",
): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      if (
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
      ) {
        return (data as { message: string }).message;
      }
      if (
        "title" in data &&
        typeof (data as { title: unknown }).title === "string"
      ) {
        return (data as { title: string }).title;
      }
    }
    if (error.message === "Network Error") {
      return "Impossible de joindre le serveur. Vérifiez votre connexion et l'adresse IP.";
    }
    if (error.code === "ECONNABORTED") {
      return "Le délai d'attente de la requête a expiré.";
    }
  }
  return fallbackMessage;
};
