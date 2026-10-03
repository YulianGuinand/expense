import { apiClient } from "./apiClient";
import {
  CreateTransactionInput,
  MonthlyStat,
  TransactionType,
  UpdateTransactionInput,
} from "@/types";

export type TransactionFilters = {
  walletId?: number;
  type?: string;
  category?: string;
  from?: string;
  to?: string;
  limit?: number;
  q?: string;
  offset?: number;
};

export type MonthlyStatsFilters = {
  walletId?: number;
  months?: number;
};

export const transactionService = {
  async getAll(filters: TransactionFilters = {}): Promise<TransactionType[]> {
    const response = await apiClient.get<TransactionType[]>("/Transaction", {
      params: filters,
    });
    return response.data;
  },

  async getById(id: number): Promise<TransactionType> {
    const response = await apiClient.get<TransactionType>(`/Transaction/${id}`);
    return response.data;
  },

  async monthlyStats(filters: MonthlyStatsFilters = {}): Promise<MonthlyStat[]> {
    const response = await apiClient.get<MonthlyStat[]>(
      "/Transaction/monthly",
      { params: filters },
    );
    return response.data;
  },

  async create(input: CreateTransactionInput): Promise<TransactionType> {
    const response = await apiClient.post<TransactionType>("/Transaction", input);
    return response.data;
  },

  async update(id: number, input: UpdateTransactionInput): Promise<TransactionType> {
    const response = await apiClient.put<TransactionType>(`/Transaction/${id}`, input);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/Transaction/${id}`);
  },
};
