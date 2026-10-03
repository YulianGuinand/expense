import { apiClient } from "./apiClient";
import { CreateWalletInput, UpdateWalletInput, WalletType } from "@/types";

export const walletService = {
  async getAll(): Promise<WalletType[]> {
    const response = await apiClient.get<WalletType[]>("/Wallet");
    return response.data;
  },

  async getById(id: number): Promise<WalletType> {
    const response = await apiClient.get<WalletType>(`/Wallet/${id}`);
    return response.data;
  },

  async create(input: CreateWalletInput): Promise<WalletType> {
    const response = await apiClient.post<WalletType>("/Wallet", input);
    return response.data;
  },

  async update(id: number, input: UpdateWalletInput): Promise<WalletType> {
    const response = await apiClient.put<WalletType>(`/Wallet/${id}`, input);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/Wallet/${id}`);
  },
};
