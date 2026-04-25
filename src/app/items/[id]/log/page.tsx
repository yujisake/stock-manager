"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  getItem,
  getIncomingList,
  getOutgoingList,
  getMovementList,
  updateIncoming,
  updateOutgoing,
  updateMovement,
  getEditHistory,
  deleteRecord,
} from "@/lib/stock-api";
import {
  SHIPMENT_TYPE_LABELS,
  MOVEMENT_FIELD_LABELS,
} from "@/lib/types";
import type {
  ItemWithInventory,
  StockIncoming,
  StockOutgoing,
  StockMovement,
  ShipmentType,
  MovementField,
  StockEditHistory,
  EditHistoryTable,
} from "@/lib/types";

type TabKey = "incoming" | "outgoing" | "movement";
type Toast = { id: number; message: string; type: "success" | "error" };

const SHIPMENT_TYPES: ShipmentType[] = [
  "normal",
  "reserve_shop",
  "reserve_online",
  "reserve_domestic",
  "reserve_export",
  "defective_ok",
  "reserve_damaged",
];

const MOVEMENT_FIELDS: MovementField[] = [
  "reserve_shop",
  "reserve_online",
  "reserve_domestic",
  "reserve_export",
  "defective_ok",
  "reserve_damaged",
  "defective_ng",
  "reserve_frame_shop",
  "reserve_frame_online",
  "reserve_frame_liquor",
];

// ============================================================================
// 修正履歴の表示で使うフィールド名ラベル
// ============================================================================
const FIELD_DISPLAY_LABELS: Record<string, string> = {
  date: "日付",
  quantity: "本数",
  delta: "差分",
  field: "対象項目",
  shipment_type: "出荷種別",
  destination: "出荷先",
  operator_name: "操作者",
  memo: "メモ",
  deleted: "削除",
};

// 値の種類に応じて表示用に変換
function formatChangeValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "shipment_type" && typeof value === "string") {
    return SHIPMENT_TYPE_LABELS[value as ShipmentType] ?? value;
  }
  if (field === "field" && typeof value === "string") {
    return MOVEMENT_FIELD_LABELS[value as MovementField] ?? value;
  }
  if (field === "deleted" && typeof value === "boolean") {
    return value ? "削除済み" : "未削除";
  }
  return String(value);
}

function formatEditedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

export default function LogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<ItemWithInventory | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("outgoing");
  const [incoming, setIncoming] = useState<StockIncoming[]>([]);
  const [outgoing, setOutgoing] = useState<StockOutgoing[]>([]);
  const [movement, setMovement] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounterRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      const tid = ++toastCounterRef.current;
      setToasts((prev) => [...prev, { id: tid, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== tid)),
        3000
      );
    },
    []
  );

  const reload = useCallback(async () => {
    const [it, inList, outList, mvList] = await Promise.all([
      getItem(id),
      getIncomingList(id),
      getOutgoingList(id),
      getMovementList(id),
    ]);
    setItem(it);
    setIncoming(inList);
    setOutgoing(outList);
    setMovement(mvList);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getItem(id),
      getIncomingList(id),
      getOutgoingList(id),
      getMovementList(id),
    ])
      .then(([it, inList, outList, mvList]) => {
        if (cancelled) return;
        setItem(it);
        setIncoming(inList);
        setOutgoing(outList);
        setMovement(mvList);
      })
      .catch(() => {
        /* noop */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-moss border-t-transparent rounded-full animate-spin" />
        <p className="text-sumi-light text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center text-sumi-light">
        <p className="text-lg font-medium">商品が見つかりません</p>
        <Link href="/" className="text-moss text-sm underline py-2 inline-block mt-4">
          一覧に戻る
        </Link>
      </div>
    );
  }

  // 削除済みフィルタ。showDeleted=false のときは deleted_at がついているレコードを除外する。
  const visibleIncoming = showDeleted
    ? incoming
    : incoming.filter((r) => !r.deleted_at);
  const visibleOutgoing = showDeleted
    ? outgoing
    : outgoing.filter((r) => !r.deleted_at);
  const visibleMovement = showDeleted
    ? movement
    : movement.filter((r) => !r.deleted_at);

  return (
    <div className="p-4 max-w-lg mx-auto pb-10">
      <Link
        href={`/items/${item.id}`}
        className="inline-flex items-center gap-2 text-sm text-moss hover:text-moss-light transition-colors mb-4 mt-1 py-2 px-1 -ml-1 min-h-[44px]"
      >
        <span className="text-base leading-none">&larr;</span>
        <span>商品詳細に戻る</span>
      </Link>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-sumi leading-snug">
          {item.name}
        </h1>
        <p className="text-sm text-sumi-light mt-1">出荷・移動・入庫の記録</p>
      </div>

      <div
        role="tablist"
        aria-label="ログ種別"
        className="grid grid-cols-3 gap-1 bg-washi border border-border rounded-xl p-1 mb-4"
      >
        {(
          [
            {
              key: "outgoing" as TabKey,
              label: `出荷 (${visibleOutgoing.length})`,
            },
            {
              key: "movement" as TabKey,
              label: `移動 (${visibleMovement.length})`,
            },
            {
              key: "incoming" as TabKey,
              label: `入庫 (${visibleIncoming.length})`,
            },
          ] as const
        ).map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(t.key);
                setEditingId(null);
                setDeletingId(null);
              }}
              className={[
                "min-h-[44px] rounded-lg text-sm font-bold transition-colors",
                active
                  ? "bg-moss text-white shadow-sm"
                  : "text-sumi-light hover:text-sumi",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 削除済み表示切り替え */}
      <label className="flex items-center gap-2 mb-3 px-1 text-xs text-sumi-light cursor-pointer select-none min-h-[32px]">
        <input
          type="checkbox"
          checked={showDeleted}
          onChange={(e) => setShowDeleted(e.target.checked)}
          className="w-4 h-4 accent-moss"
        />
        <span>削除済みを表示</span>
      </label>

      {activeTab === "incoming" && (
        <IncomingList
          itemId={item.id}
          list={visibleIncoming}
          editingId={editingId}
          setEditingId={setEditingId}
          deletingId={deletingId}
          setDeletingId={setDeletingId}
          onSaved={async () => {
            await reload();
            showToast("保存しました", "success");
          }}
          onDeleted={async () => {
            await reload();
            showToast("削除しました", "success");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {activeTab === "outgoing" && (
        <OutgoingList
          itemId={item.id}
          list={visibleOutgoing}
          editingId={editingId}
          setEditingId={setEditingId}
          deletingId={deletingId}
          setDeletingId={setDeletingId}
          onSaved={async () => {
            await reload();
            showToast("保存しました", "success");
          }}
          onDeleted={async () => {
            await reload();
            showToast("削除しました", "success");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {activeTab === "movement" && (
        <MovementList
          itemId={item.id}
          list={visibleMovement}
          editingId={editingId}
          setEditingId={setEditingId}
          deletingId={deletingId}
          setDeletingId={setDeletingId}
          onSaved={async () => {
            await reload();
            showToast("保存しました", "success");
          }}
          onDeleted={async () => {
            await reload();
            showToast("削除しました", "success");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {/* トースト通知 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "toast-enter px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white",
              toast.type === "success" ? "bg-moss" : "bg-amber",
            ].join(" ")}
          >
            {toast.type === "success" ? "✓ " : "✕ "}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 入庫リスト
// ============================================================================
function IncomingList({
  itemId,
  list,
  editingId,
  setEditingId,
  deletingId,
  setDeletingId,
  onSaved,
  onDeleted,
  onError,
}: {
  itemId: string;
  list: StockIncoming[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  if (list.length === 0) {
    return <EmptyState label="入庫の記録がありません" />;
  }
  return (
    <div className="space-y-3">
      {list.map((rec) => (
        <IncomingRow
          key={rec.id}
          itemId={itemId}
          rec={rec}
          editing={editingId === rec.id}
          deleting={deletingId === rec.id}
          onEditStart={() => {
            setEditingId(rec.id);
            setDeletingId(null);
          }}
          onEditCancel={() => setEditingId(null)}
          onDeleteStart={() => {
            setDeletingId(rec.id);
            setEditingId(null);
          }}
          onDeleteCancel={() => setDeletingId(null)}
          onSaved={async () => {
            setEditingId(null);
            await onSaved();
          }}
          onDeleted={async () => {
            setDeletingId(null);
            await onDeleted();
          }}
          onError={onError}
        />
      ))}
    </div>
  );
}

function IncomingRow({
  itemId,
  rec,
  editing,
  deleting,
  onEditStart,
  onEditCancel,
  onDeleteStart,
  onDeleteCancel,
  onSaved,
  onDeleted,
  onError,
}: {
  itemId: string;
  rec: StockIncoming;
  editing: boolean;
  deleting: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onDeleteStart: () => void;
  onDeleteCancel: () => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  const [date, setDate] = useState(rec.date);
  const [qty, setQty] = useState(String(rec.quantity));
  const [operator, setOperator] = useState(rec.operator_name ?? "");
  const [memo, setMemo] = useState(rec.memo ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setDate(rec.date);
      setQty(String(rec.quantity));
      setOperator(rec.operator_name ?? "");
      setMemo(rec.memo ?? "");
    }
  }, [editing, rec]);

  const handleSave = async () => {
    const q = parseInt(qty, 10);
    if (!Number.isInteger(q) || q < 1) {
      onError("本数は1以上の整数で指定してください");
      return;
    }
    setSaving(true);
    try {
      await updateIncoming(rec.id, itemId, date, q, operator, memo);
      await onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "エラーが発生しました");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {editing ? (
        <div className="p-4 space-y-3">
          <InlineLabel>日付</InlineLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <InlineLabel>本数</InlineLabel>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={numberClass}
          />
          <InlineLabel>操作者</InlineLabel>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className={inputClass}
            placeholder="操作者"
          />
          <InlineLabel>メモ</InlineLabel>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className={inputClass}
            placeholder="メモ"
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onEditCancel}
              className="min-h-[44px] rounded-xl border border-border bg-washi text-sm text-sumi-light hover:text-sumi transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={savePrimary(saving)}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={[
              "p-4 flex items-start justify-between gap-3",
              rec.deleted_at ? "opacity-50" : "",
            ].join(" ")}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={[
                    "text-xs text-sumi-light tabular-nums",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.date}
                </span>
                <span
                  className={[
                    "text-lg font-bold text-moss tabular-nums",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  +{rec.quantity}本
                </span>
                {rec.deleted_at && <DeletedBadge />}
              </div>
              {rec.operator_name && (
                <p
                  className={[
                    "text-xs text-sumi-light mt-1",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  操作者: {rec.operator_name}
                </p>
              )}
              {rec.memo && (
                <p
                  className={[
                    "text-xs text-sumi mt-1 whitespace-pre-wrap break-words",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.memo}
                </p>
              )}
              {rec.deleted_at && (
                <DeletedMeta
                  deletedBy={rec.deleted_by}
                  deletedAt={rec.deleted_at}
                />
              )}
            </div>
            {!rec.deleted_at && (
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={onEditStart}
                  className="text-xs font-medium text-moss border border-moss/30 rounded-lg px-3 py-2 min-h-[44px] hover:bg-moss-pale transition-colors"
                >
                  修正
                </button>
                <button
                  onClick={onDeleteStart}
                  className="text-xs font-medium text-amber border border-amber/30 rounded-lg px-3 py-2 min-h-[44px] hover:bg-amber/5 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>
          {deleting && !rec.deleted_at && (
            <DeleteConfirmForm
              table="stock_incoming"
              id={rec.id}
              onCancel={onDeleteCancel}
              onDeleted={onDeleted}
              onError={onError}
            />
          )}
          <EditHistorySection tableName="stock_incoming" recordId={rec.id} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// 出荷リスト
// ============================================================================
function OutgoingList({
  itemId,
  list,
  editingId,
  setEditingId,
  deletingId,
  setDeletingId,
  onSaved,
  onDeleted,
  onError,
}: {
  itemId: string;
  list: StockOutgoing[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  if (list.length === 0) {
    return <EmptyState label="出荷の記録がありません" />;
  }
  return (
    <div className="space-y-3">
      {list.map((rec) => (
        <OutgoingRow
          key={rec.id}
          itemId={itemId}
          rec={rec}
          editing={editingId === rec.id}
          deleting={deletingId === rec.id}
          onEditStart={() => {
            setEditingId(rec.id);
            setDeletingId(null);
          }}
          onEditCancel={() => setEditingId(null)}
          onDeleteStart={() => {
            setDeletingId(rec.id);
            setEditingId(null);
          }}
          onDeleteCancel={() => setDeletingId(null)}
          onSaved={async () => {
            setEditingId(null);
            await onSaved();
          }}
          onDeleted={async () => {
            setDeletingId(null);
            await onDeleted();
          }}
          onError={onError}
        />
      ))}
    </div>
  );
}

function OutgoingRow({
  itemId,
  rec,
  editing,
  deleting,
  onEditStart,
  onEditCancel,
  onDeleteStart,
  onDeleteCancel,
  onSaved,
  onDeleted,
  onError,
}: {
  itemId: string;
  rec: StockOutgoing;
  editing: boolean;
  deleting: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onDeleteStart: () => void;
  onDeleteCancel: () => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  const [date, setDate] = useState(rec.date);
  const [shipmentType, setShipmentType] = useState<ShipmentType>(
    rec.shipment_type
  );
  const [qty, setQty] = useState(String(rec.quantity));
  const [operator, setOperator] = useState(rec.operator_name ?? "");
  const [destination, setDestination] = useState(rec.destination ?? "");
  const [memo, setMemo] = useState(rec.memo ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setDate(rec.date);
      setShipmentType(rec.shipment_type);
      setQty(String(rec.quantity));
      setOperator(rec.operator_name ?? "");
      setDestination(rec.destination ?? "");
      setMemo(rec.memo ?? "");
    }
  }, [editing, rec]);

  const handleSave = async () => {
    const q = parseInt(qty, 10);
    if (!Number.isInteger(q) || q < 1) {
      onError("本数は1以上の整数で指定してください");
      return;
    }
    setSaving(true);
    try {
      await updateOutgoing(
        rec.id,
        itemId,
        date,
        shipmentType,
        q,
        operator,
        destination,
        memo
      );
      await onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "エラーが発生しました");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {editing ? (
        <div className="p-4 space-y-3">
          <InlineLabel>日付</InlineLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <InlineLabel>出荷種別</InlineLabel>
          <select
            value={shipmentType}
            onChange={(e) => setShipmentType(e.target.value as ShipmentType)}
            className={inputClass}
          >
            {SHIPMENT_TYPES.map((k) => (
              <option key={k} value={k}>
                {SHIPMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
          <InlineLabel>本数</InlineLabel>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={numberClass}
          />
          <InlineLabel>操作者</InlineLabel>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className={inputClass}
          />
          <InlineLabel>出荷先</InlineLabel>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={inputClass}
          />
          <InlineLabel>メモ</InlineLabel>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onEditCancel}
              className="min-h-[44px] rounded-xl border border-border bg-washi text-sm text-sumi-light hover:text-sumi transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={savePrimary(saving)}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={[
              "p-4 flex items-start justify-between gap-3",
              rec.deleted_at ? "opacity-50" : "",
            ].join(" ")}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={[
                    "text-xs text-sumi-light tabular-nums",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.date}
                </span>
                <span
                  className={[
                    "text-xs bg-washi border border-border rounded px-1.5 py-0.5 text-sumi",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {SHIPMENT_TYPE_LABELS[rec.shipment_type]}
                </span>
                <span
                  className={[
                    "text-lg font-bold text-amber tabular-nums",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  -{rec.quantity}本
                </span>
                {rec.deleted_at && <DeletedBadge />}
              </div>
              {rec.destination && (
                <p
                  className={[
                    "text-xs text-sumi-light mt-1",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  出荷先: {rec.destination}
                </p>
              )}
              {rec.operator_name && (
                <p
                  className={[
                    "text-xs text-sumi-light mt-0.5",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  操作者: {rec.operator_name}
                </p>
              )}
              {rec.memo && (
                <p
                  className={[
                    "text-xs text-sumi mt-1 whitespace-pre-wrap break-words",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.memo}
                </p>
              )}
              {rec.deleted_at && (
                <DeletedMeta
                  deletedBy={rec.deleted_by}
                  deletedAt={rec.deleted_at}
                />
              )}
            </div>
            {!rec.deleted_at && (
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={onEditStart}
                  className="text-xs font-medium text-moss border border-moss/30 rounded-lg px-3 py-2 min-h-[44px] hover:bg-moss-pale transition-colors"
                >
                  修正
                </button>
                <button
                  onClick={onDeleteStart}
                  className="text-xs font-medium text-amber border border-amber/30 rounded-lg px-3 py-2 min-h-[44px] hover:bg-amber/5 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>
          {deleting && !rec.deleted_at && (
            <DeleteConfirmForm
              table="stock_outgoing"
              id={rec.id}
              onCancel={onDeleteCancel}
              onDeleted={onDeleted}
              onError={onError}
            />
          )}
          <EditHistorySection tableName="stock_outgoing" recordId={rec.id} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// 移動リスト
// ============================================================================
function MovementList({
  itemId,
  list,
  editingId,
  setEditingId,
  deletingId,
  setDeletingId,
  onSaved,
  onDeleted,
  onError,
}: {
  itemId: string;
  list: StockMovement[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  if (list.length === 0) {
    return <EmptyState label="移動の記録がありません" />;
  }
  return (
    <div className="space-y-3">
      {list.map((rec) => (
        <MovementRow
          key={rec.id}
          itemId={itemId}
          rec={rec}
          editing={editingId === rec.id}
          deleting={deletingId === rec.id}
          onEditStart={() => {
            setEditingId(rec.id);
            setDeletingId(null);
          }}
          onEditCancel={() => setEditingId(null)}
          onDeleteStart={() => {
            setDeletingId(rec.id);
            setEditingId(null);
          }}
          onDeleteCancel={() => setDeletingId(null)}
          onSaved={async () => {
            setEditingId(null);
            await onSaved();
          }}
          onDeleted={async () => {
            setDeletingId(null);
            await onDeleted();
          }}
          onError={onError}
        />
      ))}
    </div>
  );
}

function MovementRow({
  itemId,
  rec,
  editing,
  deleting,
  onEditStart,
  onEditCancel,
  onDeleteStart,
  onDeleteCancel,
  onSaved,
  onDeleted,
  onError,
}: {
  itemId: string;
  rec: StockMovement;
  editing: boolean;
  deleting: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onDeleteStart: () => void;
  onDeleteCancel: () => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  const [date, setDate] = useState(rec.date);
  const [field, setField] = useState<MovementField>(rec.field);
  const [sign, setSign] = useState<"plus" | "minus">(
    rec.delta >= 0 ? "plus" : "minus"
  );
  const [absQty, setAbsQty] = useState(String(Math.abs(rec.delta)));
  const [operator, setOperator] = useState(rec.operator_name ?? "");
  const [memo, setMemo] = useState(rec.memo ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setDate(rec.date);
      setField(rec.field);
      setSign(rec.delta >= 0 ? "plus" : "minus");
      setAbsQty(String(Math.abs(rec.delta)));
      setOperator(rec.operator_name ?? "");
      setMemo(rec.memo ?? "");
    }
  }, [editing, rec]);

  const handleSave = async () => {
    const q = parseInt(absQty, 10);
    if (!Number.isInteger(q) || q < 1) {
      onError("本数は1以上の整数で指定してください");
      return;
    }
    const delta = sign === "plus" ? q : -q;
    setSaving(true);
    try {
      await updateMovement(rec.id, itemId, date, field, delta, operator, memo);
      await onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "エラーが発生しました");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {editing ? (
        <div className="p-4 space-y-3">
          <InlineLabel>日付</InlineLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <InlineLabel>対象項目</InlineLabel>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as MovementField)}
            className={inputClass}
          >
            {MOVEMENT_FIELDS.map((f) => (
              <option key={f} value={f}>
                {MOVEMENT_FIELD_LABELS[f]}
              </option>
            ))}
          </select>
          <InlineLabel>差分</InlineLabel>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSign("plus")}
              className={[
                "min-h-[44px] rounded-xl border-2 text-sm font-bold transition-all",
                sign === "plus"
                  ? "border-moss bg-moss text-white"
                  : "border-border bg-washi text-sumi-light",
              ].join(" ")}
            >
              ▲ 増加
            </button>
            <button
              type="button"
              onClick={() => setSign("minus")}
              className={[
                "min-h-[44px] rounded-xl border-2 text-sm font-bold transition-all",
                sign === "minus"
                  ? "border-amber bg-amber text-white"
                  : "border-border bg-washi text-sumi-light",
              ].join(" ")}
            >
              ▼ 減少
            </button>
          </div>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={absQty}
            onChange={(e) => setAbsQty(e.target.value)}
            className={numberClass}
          />
          <InlineLabel>操作者</InlineLabel>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className={inputClass}
          />
          <InlineLabel>メモ</InlineLabel>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onEditCancel}
              className="min-h-[44px] rounded-xl border border-border bg-washi text-sm text-sumi-light hover:text-sumi transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={savePrimary(saving)}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={[
              "p-4 flex items-start justify-between gap-3",
              rec.deleted_at ? "opacity-50" : "",
            ].join(" ")}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={[
                    "text-xs text-sumi-light tabular-nums",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.date}
                </span>
                <span
                  className={[
                    "text-xs bg-washi border border-border rounded px-1.5 py-0.5 text-sumi",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {MOVEMENT_FIELD_LABELS[rec.field]}
                </span>
                <span
                  className={[
                    "text-lg font-bold tabular-nums",
                    rec.delta >= 0 ? "text-moss" : "text-amber",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.delta >= 0 ? "+" : ""}
                  {rec.delta}本
                </span>
                {rec.deleted_at && <DeletedBadge />}
              </div>
              {rec.operator_name && (
                <p
                  className={[
                    "text-xs text-sumi-light mt-1",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  操作者: {rec.operator_name}
                </p>
              )}
              {rec.memo && (
                <p
                  className={[
                    "text-xs text-sumi mt-1 whitespace-pre-wrap break-words",
                    rec.deleted_at ? "line-through" : "",
                  ].join(" ")}
                >
                  {rec.memo}
                </p>
              )}
              {rec.deleted_at && (
                <DeletedMeta
                  deletedBy={rec.deleted_by}
                  deletedAt={rec.deleted_at}
                />
              )}
            </div>
            {!rec.deleted_at && (
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={onEditStart}
                  className="text-xs font-medium text-moss border border-moss/30 rounded-lg px-3 py-2 min-h-[44px] hover:bg-moss-pale transition-colors"
                >
                  修正
                </button>
                <button
                  onClick={onDeleteStart}
                  className="text-xs font-medium text-amber border border-amber/30 rounded-lg px-3 py-2 min-h-[44px] hover:bg-amber/5 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>
          {deleting && !rec.deleted_at && (
            <DeleteConfirmForm
              table="stock_movement"
              id={rec.id}
              onCancel={onDeleteCancel}
              onDeleted={onDeleted}
              onError={onError}
            />
          )}
          <EditHistorySection tableName="stock_movement" recordId={rec.id} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// 修正履歴セクション
// ============================================================================
// 各レコード行の下部に展開式で表示する。初回展開時にサーバーから取得する。
// ============================================================================
function EditHistorySection({
  tableName,
  recordId,
}: {
  tableName: EditHistoryTable;
  recordId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<StockEditHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // マウント時に件数取得。履歴0件ならコンポーネント自体を表示しない。
  // 件数取得失敗時は静かに無視（履歴セクションが表示されないだけで本体UIへの影響なし）。
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getEditHistory(tableName, recordId);
        if (cancelled) return;
        setHistory(list);
        setLoaded(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tableName, recordId]);

  // ロード前、もしくはロード済みで履歴0件なら何も表示しない
  if (!loaded || history.length === 0) return null;

  const count = history.length;

  return (
    <div className="border-t border-border bg-washi/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-sumi-light hover:text-sumi transition-colors min-h-[44px]"
      >
        <span className="font-medium">修正履歴 {count}件</span>
        <span
          className={[
            "text-sm transition-transform inline-block",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {error && <p className="text-xs text-amber">{error}</p>}
          {history.map((h) => (
            <div
              key={h.id}
              className="rounded-xl border border-border bg-white px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-sumi-light tabular-nums">
                  {formatEditedAt(h.edited_at)}
                </span>
                {h.edited_by && (
                  <span className="text-[11px] text-sumi-light">
                    操作者: {h.edited_by}
                  </span>
                )}
              </div>
              <ul className="mt-1.5 space-y-1">
                {Object.entries(h.changes).map(([field, diff]) => (
                  <li
                    key={field}
                    className="text-xs text-sumi flex flex-wrap items-baseline gap-1.5"
                  >
                    <span className="text-sumi-light font-medium">
                      {FIELD_DISPLAY_LABELS[field] ?? field}:
                    </span>
                    <span className="text-amber line-through">
                      {formatChangeValue(field, diff.old)}
                    </span>
                    <span className="text-sumi-light">→</span>
                    <span className="text-moss font-semibold">
                      {formatChangeValue(field, diff.new)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 共通 ----

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-sumi-light">
      <p className="text-sm">{label}</p>
    </div>
  );
}

function InlineLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs text-sumi-light font-medium block">
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi";

const numberClass =
  "w-full border-2 border-moss/30 focus:border-moss rounded-xl px-3 py-3 text-2xl text-center font-bold text-sumi outline-none transition-colors tabular-nums";

function savePrimary(disabled: boolean): string {
  return [
    "min-h-[44px] rounded-xl text-sm font-bold tracking-wide transition-all",
    disabled
      ? "bg-moss/40 text-white cursor-not-allowed"
      : "bg-moss text-white active:bg-moss-light hover:bg-moss-light",
  ].join(" ");
}

// ============================================================================
// 削除済み関連の表示部品
// ============================================================================

function DeletedBadge() {
  return (
    <span className="text-[10px] font-bold bg-amber text-white rounded px-1.5 py-0.5 tracking-wide">
      削除済み
    </span>
  );
}

function DeletedMeta({
  deletedBy,
  deletedAt,
}: {
  deletedBy: string | null;
  deletedAt: string;
}) {
  return (
    <p className="text-[11px] text-amber mt-1.5">
      削除: {deletedBy ?? "—"} / {formatEditedAt(deletedAt)}
    </p>
  );
}

// ============================================================================
// 削除確認フォーム
// ============================================================================
// 行の下にインライン展開する。localStorage の operator_name を初期値にする。
// 削除実行時は deleteRecord を呼び、成功なら onDeleted で親に通知する。
// ============================================================================
function DeleteConfirmForm({
  table,
  id,
  onCancel,
  onDeleted,
  onError,
}: {
  table: "stock_incoming" | "stock_outgoing" | "stock_movement";
  id: string;
  onCancel: () => void;
  onDeleted: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  const [operator, setOperator] = useState("");
  const [deleting, setDeleting] = useState(false);

  // localStorage の operator_name を初期値に
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem("operator_name") ?? ""
          : "";
      setOperator(saved);
    } catch {
      // localStorage が使えない環境では空のままにする
    }
  }, []);

  const handleDelete = async () => {
    const name = operator.trim();
    if (!name) {
      onError("削除する操作者名を入力してください");
      return;
    }
    setDeleting(true);
    try {
      await deleteRecord(table, id, name);
      // 次回以降の初期値として保存
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("operator_name", name);
        }
      } catch {
        // 失敗しても本処理には影響しない
      }
      await onDeleted();
    } catch (err) {
      onError(err instanceof Error ? err.message : "削除に失敗しました");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border-t border-amber/30 bg-amber/5 p-4 space-y-3">
      <p className="text-xs text-sumi font-medium">
        この記録を削除します。よろしいですか？
      </p>
      <InlineLabel>削除する操作者名</InlineLabel>
      <input
        type="text"
        value={operator}
        onChange={(e) => setOperator(e.target.value)}
        className={inputClass}
        placeholder="操作者名"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="min-h-[44px] rounded-xl border border-border bg-washi text-sm text-sumi-light hover:text-sumi transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={[
            "min-h-[44px] rounded-xl text-sm font-bold tracking-wide transition-all",
            deleting
              ? "bg-amber/40 text-white cursor-not-allowed"
              : "bg-amber text-white active:opacity-90 hover:opacity-90",
          ].join(" ")}
        >
          {deleting ? "削除中..." : "削除する"}
        </button>
      </div>
    </div>
  );
}
