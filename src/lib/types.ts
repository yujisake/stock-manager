// ============================================================================
// 型定義
// ----------------------------------------------------------------------------
// DB行の型は database.types.ts（`npm run gen:types` で自動生成）から取り込む。
// アプリ固有の絞り込み（ENUM相当の Union 型・JSON 構造化）はこのファイルで重ねる。
// ============================================================================

import type { Database } from "./database.types";

// ---- DBスキーマ直結の生型（必要な箇所だけ手動でキャストして使う） ----
export type DbStockItem = Database["public"]["Tables"]["stock_items"]["Row"];
export type DbStockInventory =
  Database["public"]["Tables"]["stock_inventory"]["Row"];
export type DbStockIncoming =
  Database["public"]["Tables"]["stock_incoming"]["Row"];
export type DbStockOutgoing =
  Database["public"]["Tables"]["stock_outgoing"]["Row"];
export type DbStockMovement =
  Database["public"]["Tables"]["stock_movement"]["Row"];
export type DbStockEditHistory =
  Database["public"]["Tables"]["stock_edit_history"]["Row"];

// ---- ENUM相当（DBはtextカラムだがアプリ側で値を絞り込む） ---------------

export type ShipmentType =
  | "normal"
  | "reserve_shop"
  | "reserve_online"
  | "reserve_domestic"
  | "reserve_export"
  | "defective_ok"
  | "reserve_damaged"
  | "reserve_frame_shop"
  | "reserve_frame_online"
  | "reserve_frame_liquor";

export type MovementField =
  | "reserve_shop"
  | "reserve_online"
  | "reserve_domestic"
  | "reserve_export"
  | "defective_ok"
  | "reserve_damaged"
  | "defective_ng"
  | "reserve_frame_shop"
  | "reserve_frame_online"
  | "reserve_frame_liquor";

export type EditHistoryTable =
  | "stock_incoming"
  | "stock_outgoing"
  | "stock_movement";

// ---- アプリ用の絞り込み型 -------------------------------------------------
// DB行型の上に、アプリ側で確実に値が入る前提のフィールドや、
// DB上は text/json でも実際は Union 型・構造化型として扱いたいフィールドを上書きする。
// ※ 値は recalculate やフォーム制約で保証している。

export type StockItem = DbStockItem;

export type StockInventory = DbStockInventory;

export type StockIncoming = DbStockIncoming;

export type StockOutgoing = Omit<DbStockOutgoing, "shipment_type"> & {
  shipment_type: ShipmentType;
};

export type StockMovement = Omit<DbStockMovement, "field"> & {
  field: MovementField;
};

export type StockEditHistory = Omit<DbStockEditHistory, "changes"> & {
  changes: Record<string, { old: unknown; new: unknown }>;
};

// ---- 集約型 -----------------------------------------------------------------

export interface ItemWithInventory extends StockItem {
  inventory: StockInventory;
}

// ---- 使える在庫計算 --------------------------------------------------------

export function getAvailableStock(inv: StockInventory): number {
  return (
    inv.total -
    inv.reserve_shop -
    inv.reserve_online -
    inv.reserve_domestic -
    inv.reserve_export -
    inv.defective_ok -
    inv.reserve_damaged -
    inv.defective_ng -
    // 確保枠もフリーに使える在庫から差し引く
    inv.reserve_frame_shop -
    inv.reserve_frame_online -
    inv.reserve_frame_liquor
  );
}

// ---- ラベル定義 ------------------------------------------------------------

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  normal: "通常出荷",
  reserve_shop: "売店取置から出荷",
  reserve_online: "通販取置から出荷",
  reserve_domestic: "国内取置から出荷",
  reserve_export: "海外取置から出荷",
  defective_ok: "不良品（見本可）出荷",
  reserve_damaged: "破損予備出荷",
  reserve_frame_shop: "売店 確保枠から出荷",
  reserve_frame_online: "通販 確保枠から出荷",
  reserve_frame_liquor: "酒販 確保枠から出荷",
};

export const MOVEMENT_FIELD_LABELS: Record<MovementField, string> = {
  reserve_shop: "売店 取置",
  reserve_online: "通販 取置",
  reserve_domestic: "国内 取置",
  reserve_export: "海外 取置",
  defective_ok: "不良品（見本可）",
  reserve_damaged: "破損予備",
  defective_ng: "不良品（見本不可）",
  reserve_frame_shop: "売店 確保枠",
  reserve_frame_online: "通販 確保枠",
  reserve_frame_liquor: "酒販 確保枠",
};

export const INVENTORY_FIELD_LABELS: Record<string, string> = {
  total: "総在庫",
  reserve_shop: "売店 取置",
  reserve_online: "通販 取置",
  reserve_domestic: "国内 取置",
  reserve_export: "海外 取置",
  defective_ok: "不良品（見本可）",
  reserve_damaged: "破損予備",
  defective_ng: "不良品（見本不可）",
  reserve_frame_shop: "売店 確保枠",
  reserve_frame_online: "通販 確保枠",
  reserve_frame_liquor: "酒販 確保枠",
};
