export const roles = ["admin", "produksi", "owner"] as const;
export type Role = (typeof roles)[number];

export type Actor = {
  id: string;
  email: string | null;
  role: Role;
};

export type StockWarning = {
  itemId: string;
  variantId: string | null;
  currentQty: number;
  requestedQty: number;
  message: string;
};

