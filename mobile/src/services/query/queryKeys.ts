export const queryKeys = {
  wallets: {
    all: ["wallets"] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (walletId: number) => ["transactions", "list", walletId] as const,
    detail: (id: number) => ["transactions", id] as const,
    monthly: (walletId: number | null, months: number) =>
      ["transactions", "monthly", walletId ?? "all", months] as const,
    search: (q: string) => ["transactions", "search", q] as const,
  },
};
