export type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  min_stock_threshold: number;
  qr_identifier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  movement_type: "in" | "out" | "defective";
  quantity: number;
  department: string | null;
  operator_name: string;
  notes: string | null;
  created_at: string;
};

export type ProductStockSummary = {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_stock_threshold: number;
  qr_identifier: string;
  is_active: boolean;
  total_in: number;
  total_out: number;
  total_defective: number;
  current_stock: number;
};

export type StockByDepartment = {
  product_id: string;
  department: string;
  dept_in: number;
  dept_out: number;
  dept_defective: number;
  dept_stock: number;
};

export const CATEGORIES = [
  "日本酒",
  "ビール",
  "ワイン",
  "ウイスキー",
  "焼酎",
  "リキュール",
  "その他",
] as const;

export const DEPARTMENTS = [
  "倉庫",
  "営業部",
  "本社",
  "店舗A",
  "店舗B",
  "その他",
] as const;
