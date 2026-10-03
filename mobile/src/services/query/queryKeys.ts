export const queryKeys = {
  wallets: {
    all: ["wallets"] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (walletId: number) => ["transactions", "list", walletId] as const,
    detail: (id: number) => ["transactions", id] as const,
    summary: ["transactions", "summary"] as const,
  },
};
