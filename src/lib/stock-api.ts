import { supabase } from "./supabase";
import type {
  ItemWithInventory,
  ShipmentType,
  MovementField,
  StockIncoming,
  StockOutgoing,
  StockMovement,
  StockEditHistory,
  EditHistoryTable,
} from "./types";

// ============================================================================
// アイテム取得
// ============================================================================

export async function getAllItems(): Promise<ItemWithInventory[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*, inventory:stock_inventory(*)")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((item) => ({
    ...item,
    inventory: Array.isArray(item.inventory) ? item.inventory[0] : item.inventory,
  }));
}

export async function getItem(id: string): Promise<ItemWithInventory | null> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*, inventory:stock_inventory(*)")
    .eq("id", id)
    .single();

  if (error) return null;

  return {
    ...data,
    inventory: Array.isArray(data.inventory) ? data.inventory[0] : data.inventory,
  };
}

// ============================================================================
// 再計算（核心ロジック）
// ============================================================================
// 入庫・出荷・移動ログをすべて取得し、計算式に基づき stock_inventory を upsert する。
// 値は Math.max(0, ...) でガードし負値を避ける。
// ============================================================================

export async function recalculateInventory(itemId: string): Promise<void> {
  const [incomingRes, outgoingRes, movementRes] = await Promise.all([
    supabase
      .from("stock_incoming")
      .select("quantity")
      .eq("item_id", itemId)
      .is("deleted_at", null),
    supabase
      .from("stock_outgoing")
      .select("shipment_type, quantity")
      .eq("item_id", itemId)
      .is("deleted_at", null),
    supabase
      .from("stock_movement")
      .select("field, delta")
      .eq("item_id", itemId)
      .is("deleted_at", null),
  ]);

  if (incomingRes.error) throw incomingRes.error;
  if (outgoingRes.error) throw outgoingRes.error;
  if (movementRes.error) throw movementRes.error;

  const incoming = (incomingRes.data ?? []) as Array<{ quantity: number }>;
  const outgoing = (outgoingRes.data ?? []) as Array<{
    shipment_type: ShipmentType;
    quantity: number;
  }>;
  const movement = (movementRes.data ?? []) as Array<{
    field: MovementField;
    delta: number;
  }>;

  // 入庫合計
  const sumIncoming = incoming.reduce((acc, r) => acc + r.quantity, 0);

  // 出荷合計（全種別）
  const sumOutgoingAll = outgoing.reduce((acc, r) => acc + r.quantity, 0);

  // 種別ごとの出荷合計
  const outgoingByType: Record<ShipmentType, number> = {
    normal: 0,
    reserve_shop: 0,
    reserve_online: 0,
    reserve_domestic: 0,
    reserve_export: 0,
    defective_ok: 0,
    reserve_damaged: 0,
    reserve_frame_shop: 0,
    reserve_frame_online: 0,
    reserve_frame_liquor: 0,
  };
  for (const r of outgoing) {
    outgoingByType[r.shipment_type] =
      (outgoingByType[r.shipment_type] ?? 0) + r.quantity;
  }

  // フィールドごとの移動合計（差分の合計）
  const movementByField: Record<MovementField, number> = {
    reserve_shop: 0,
    reserve_online: 0,
    reserve_domestic: 0,
    reserve_export: 0,
    defective_ok: 0,
    reserve_damaged: 0,
    defective_ng: 0,
    reserve_frame_shop: 0,
    reserve_frame_online: 0,
    reserve_frame_liquor: 0,
  };
  for (const r of movement) {
    movementByField[r.field] = (movementByField[r.field] ?? 0) + r.delta;
  }

  // 総在庫 = 入庫 − 出荷全種別
  const total = Math.max(0, sumIncoming - sumOutgoingAll);

  // 各取置系 = 移動差分 − 対応出荷（defective_ng は出荷不可のため出荷を減算しない）
  const reserve_shop = Math.max(
    0,
    movementByField.reserve_shop - outgoingByType.reserve_shop
  );
  const reserve_online = Math.max(
    0,
    movementByField.reserve_online - outgoingByType.reserve_online
  );
  const reserve_domestic = Math.max(
    0,
    movementByField.reserve_domestic - outgoingByType.reserve_domestic
  );
  const reserve_export = Math.max(
    0,
    movementByField.reserve_export - outgoingByType.reserve_export
  );
  const defective_ok = Math.max(
    0,
    movementByField.defective_ok - outgoingByType.defective_ok
  );
  const reserve_damaged = Math.max(
    0,
    movementByField.reserve_damaged - outgoingByType.reserve_damaged
  );
  const defective_ng = Math.max(0, movementByField.defective_ng);

  // 確保枠は出荷種別を持つようになったため、取置と同様
  // 移動差分 − 対応出荷 で算出する
  const reserve_frame_shop = Math.max(
    0,
    movementByField.reserve_frame_shop - outgoingByType.reserve_frame_shop
  );
  const reserve_frame_online = Math.max(
    0,
    movementByField.reserve_frame_online - outgoingByType.reserve_frame_online
  );
  const reserve_frame_liquor = Math.max(
    0,
    movementByField.reserve_frame_liquor - outgoingByType.reserve_frame_liquor
  );

  // stock_inventory は item_id がユニーク。onConflict で upsert し
  // 同時更新時の二重 INSERT を防ぐ。
  const payload = {
    item_id: itemId,
    total,
    reserve_shop,
    reserve_online,
    reserve_domestic,
    reserve_export,
    defective_ok,
    reserve_damaged,
    defective_ng,
    reserve_frame_shop,
    reserve_frame_online,
    reserve_frame_liquor,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("stock_inventory")
    .upsert(payload, { onConflict: "item_id" });
  if (error) throw error;
}

// ============================================================================
// 修正履歴
// ============================================================================
// 更新前後の値を比較し、変更のあったフィールドのみ stock_edit_history に INSERT する。
// 失敗はスローせず console.error に留める（本体の更新成功を優先するため）。
// ============================================================================

type ChangeDiff = Record<string, { old: unknown; new: unknown }>;

function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): ChangeDiff {
  const diff: ChangeDiff = {};
  for (const f of fields) {
    const o = before[f] ?? null;
    const n = after[f] ?? null;
    // null と undefined は同値扱い。プリミティブは === で比較。
    if (o !== n) {
      diff[f] = { old: o, new: n };
    }
  }
  return diff;
}

async function recordEditHistory(
  tableName: EditHistoryTable,
  recordId: string,
  changes: ChangeDiff,
  editedBy: string | null
): Promise<void> {
  if (Object.keys(changes).length === 0) return;
  const { error } = await supabase.from("stock_edit_history").insert({
    table_name: tableName,
    record_id: recordId,
    edited_by: editedBy,
    changes,
  });
  if (error) {
    // 履歴記録の失敗は本体処理を止めない
    console.error("修正履歴の記録に失敗しました", error);
  }
}

export async function getEditHistory(
  tableName: EditHistoryTable,
  recordId: string
): Promise<StockEditHistory[]> {
  const { data, error } = await supabase
    .from("stock_edit_history")
    .select("*")
    .eq("table_name", tableName)
    .eq("record_id", recordId)
    .order("edited_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockEditHistory[];
}

// ============================================================================
// 入庫
// ============================================================================

export async function addIncoming(
  itemId: string,
  date: string,
  quantity: number,
  operatorName: string,
  memo: string
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("入庫本数は1以上の整数で指定してください");
  }
  const { error } = await supabase.from("stock_incoming").insert({
    item_id: itemId,
    date,
    quantity,
    operator_name: operatorName || null,
    memo: memo || null,
  });
  if (error) throw error;
  await recalculateInventory(itemId);
}

export async function updateIncoming(
  id: string,
  itemId: string,
  date: string,
  quantity: number,
  operatorName: string,
  memo: string
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("入庫本数は1以上の整数で指定してください");
  }
  // 1. 更新前の値を取得
  const { data: beforeData, error: beforeErr } = await supabase
    .from("stock_incoming")
    .select("*")
    .eq("id", id)
    .single();
  if (beforeErr) throw beforeErr;

  const nextOperator = operatorName || null;
  const nextMemo = memo || null;

  // 2. DB更新
  const { error } = await supabase
    .from("stock_incoming")
    .update({
      date,
      quantity,
      operator_name: nextOperator,
      memo: nextMemo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  // 3. 変更フィールドのみ履歴に記録
  const changes = diffRecords(
    beforeData as Record<string, unknown>,
    {
      date,
      quantity,
      operator_name: nextOperator,
      memo: nextMemo,
    },
    ["date", "quantity", "operator_name", "memo"]
  );
  await recordEditHistory("stock_incoming", id, changes, nextOperator);

  // 4. 再計算
  await recalculateInventory(itemId);
}

export async function getIncomingList(
  itemId: string
): Promise<StockIncoming[]> {
  const { data, error } = await supabase
    .from("stock_incoming")
    .select("*")
    .eq("item_id", itemId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockIncoming[];
}

// ============================================================================
// 出荷
// ============================================================================

export async function addOutgoing(
  itemId: string,
  date: string,
  shipmentType: ShipmentType,
  quantity: number,
  operatorName: string,
  destination: string,
  memo: string
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("出荷本数は1以上の整数で指定してください");
  }
  const { error } = await supabase.from("stock_outgoing").insert({
    item_id: itemId,
    date,
    shipment_type: shipmentType,
    quantity,
    operator_name: operatorName || null,
    destination: destination || null,
    memo: memo || null,
  });
  if (error) throw error;
  await recalculateInventory(itemId);
}

export async function updateOutgoing(
  id: string,
  itemId: string,
  date: string,
  shipmentType: ShipmentType,
  quantity: number,
  operatorName: string,
  destination: string,
  memo: string
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("出荷本数は1以上の整数で指定してください");
  }
  // 1. 更新前の値を取得
  const { data: beforeData, error: beforeErr } = await supabase
    .from("stock_outgoing")
    .select("*")
    .eq("id", id)
    .single();
  if (beforeErr) throw beforeErr;

  const nextOperator = operatorName || null;
  const nextDestination = destination || null;
  const nextMemo = memo || null;

  // 2. DB更新
  const { error } = await supabase
    .from("stock_outgoing")
    .update({
      date,
      shipment_type: shipmentType,
      quantity,
      operator_name: nextOperator,
      destination: nextDestination,
      memo: nextMemo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  // 3. 履歴
  const changes = diffRecords(
    beforeData as Record<string, unknown>,
    {
      date,
      shipment_type: shipmentType,
      quantity,
      operator_name: nextOperator,
      destination: nextDestination,
      memo: nextMemo,
    },
    [
      "date",
      "shipment_type",
      "quantity",
      "operator_name",
      "destination",
      "memo",
    ]
  );
  await recordEditHistory("stock_outgoing", id, changes, nextOperator);

  // 4. 再計算
  await recalculateInventory(itemId);
}

export async function getOutgoingList(
  itemId: string
): Promise<StockOutgoing[]> {
  const { data, error } = await supabase
    .from("stock_outgoing")
    .select("*")
    .eq("item_id", itemId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockOutgoing[];
}

// ============================================================================
// 移動
// ============================================================================

export async function addMovement(
  itemId: string,
  date: string,
  field: MovementField,
  delta: number,
  operatorName: string,
  memo: string
): Promise<void> {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("差分は0以外の整数で指定してください");
  }
  const { error } = await supabase.from("stock_movement").insert({
    item_id: itemId,
    date,
    field,
    delta,
    operator_name: operatorName || null,
    memo: memo || null,
  });
  if (error) throw error;
  await recalculateInventory(itemId);
}

export async function updateMovement(
  id: string,
  itemId: string,
  date: string,
  field: MovementField,
  delta: number,
  operatorName: string,
  memo: string
): Promise<void> {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("差分は0以外の整数で指定してください");
  }
  // 1. 更新前の値を取得
  const { data: beforeData, error: beforeErr } = await supabase
    .from("stock_movement")
    .select("*")
    .eq("id", id)
    .single();
  if (beforeErr) throw beforeErr;

  const nextOperator = operatorName || null;
  const nextMemo = memo || null;

  // 2. DB更新
  const { error } = await supabase
    .from("stock_movement")
    .update({
      date,
      field,
      delta,
      operator_name: nextOperator,
      memo: nextMemo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  // 3. 履歴
  const changes = diffRecords(
    beforeData as Record<string, unknown>,
    {
      date,
      field,
      delta,
      operator_name: nextOperator,
      memo: nextMemo,
    },
    ["date", "field", "delta", "operator_name", "memo"]
  );
  await recordEditHistory("stock_movement", id, changes, nextOperator);

  // 4. 再計算
  await recalculateInventory(itemId);
}

export async function getMovementList(
  itemId: string
): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movement")
    .select("*")
    .eq("item_id", itemId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockMovement[];
}

// ============================================================================
// ソフトデリート
// ============================================================================
// 物理削除せず deleted_at / deleted_by を立てる。
// 削除済みは recalculateInventory で除外され、UI 側でも非表示にできる。
// ============================================================================

type DeletableTable =
  | "stock_incoming"
  | "stock_outgoing"
  | "stock_movement";

export async function deleteRecord(
  table: DeletableTable,
  id: string,
  deletedBy: string
): Promise<void> {
  // 1. 対象レコードの item_id を事前取得（削除後に再計算に必要）
  const { data: target, error: fetchErr } = await supabase
    .from(table)
    .select("item_id, deleted_at")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;
  if (!target) throw new Error("対象レコードが見つかりません");

  // すでに削除済みなら二重削除を避ける
  if (target.deleted_at) {
    throw new Error("このレコードはすでに削除されています");
  }

  const itemId = target.item_id as string;
  const trimmedBy = (deletedBy ?? "").trim();
  if (!trimmedBy) {
    throw new Error("削除する操作者名を入力してください");
  }

  // 2. ソフトデリート
  const nowIso = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from(table)
    .update({
      deleted_at: nowIso,
      deleted_by: trimmedBy,
      updated_at: nowIso,
    })
    .eq("id", id);
  if (updateErr) throw updateErr;

  // 3. 編集履歴に削除記録を残す
  await recordEditHistory(
    table,
    id,
    { deleted: { old: false, new: true } },
    trimmedBy
  );

  // 4. 在庫再計算
  await recalculateInventory(itemId);
}
