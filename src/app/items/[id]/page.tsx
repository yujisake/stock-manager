"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import {
  getItem,
  addIncoming,
  addOutgoing,
  addMovement,
} from "@/lib/stock-api";
import {
  getAvailableStock,
  INVENTORY_FIELD_LABELS,
  SHIPMENT_TYPE_LABELS,
  MOVEMENT_FIELD_LABELS,
} from "@/lib/types";
import type {
  ItemWithInventory,
  StockInventory,
  ShipmentType,
  MovementField,
} from "@/lib/types";

type TabKey = "incoming" | "outgoing" | "movement";
type MovementSign = "plus" | "minus";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

type InventoryNumericField = keyof Pick<
  StockInventory,
  | "total"
  | "reserve_shop"
  | "reserve_online"
  | "reserve_domestic"
  | "reserve_export"
  | "defective_ok"
  | "reserve_damaged"
  | "defective_ng"
  | "reserve_frame_shop"
  | "reserve_frame_online"
  | "reserve_frame_liquor"
>;

// 在庫内訳をセクションごとに分けて表示する
const INVENTORY_SECTIONS: Array<{
  title: string;
  fields: InventoryNumericField[];
}> = [
  {
    title: "総在庫",
    fields: ["total"],
  },
  {
    title: "確保枠（部署のフリー在庫プール）",
    fields: [
      "reserve_frame_shop",
      "reserve_frame_online",
      "reserve_frame_liquor",
    ],
  },
  {
    title: "取置（出荷先が決まっているもの）",
    fields: [
      "reserve_shop",
      "reserve_online",
      "reserve_domestic",
      "reserve_export",
    ],
  },
  {
    title: "不良・破損",
    fields: ["defective_ok", "reserve_damaged", "defective_ng"],
  },
];

const SHIPMENT_TYPES: ShipmentType[] = [
  "normal",
  "reserve_frame_shop",
  "reserve_frame_online",
  "reserve_frame_liquor",
  "reserve_shop",
  "reserve_online",
  "reserve_domestic",
  "reserve_export",
  "defective_ok",
  "reserve_damaged",
];

// 移動対象をセクション分けして表示
const MOVEMENT_FIELD_GROUPS: Array<{
  label: string;
  fields: MovementField[];
}> = [
  {
    label: "確保枠",
    fields: [
      "reserve_frame_shop",
      "reserve_frame_online",
      "reserve_frame_liquor",
    ],
  },
  {
    label: "取置",
    fields: [
      "reserve_shop",
      "reserve_online",
      "reserve_domestic",
      "reserve_export",
    ],
  },
  {
    label: "不良・破損",
    fields: ["defective_ok", "reserve_damaged", "defective_ng"],
  },
];

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<ItemWithInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounterRef = useRef(0);

  // 入庫
  const [inDate, setInDate] = useState(todayStr());
  const [inQty, setInQty] = useState("");
  const [inMemo, setInMemo] = useState("");
  const [inSaving, setInSaving] = useState(false);

  // 出荷
  const [outDate, setOutDate] = useState(todayStr());
  const [outType, setOutType] = useState<ShipmentType>("normal");
  const [outQty, setOutQty] = useState("");
  const [outDestination, setOutDestination] = useState("");
  const [outMemo, setOutMemo] = useState("");
  const [outSaving, setOutSaving] = useState(false);

  // 移動
  const [mvDate, setMvDate] = useState(todayStr());
  const [mvField, setMvField] = useState<MovementField>("reserve_frame_shop");
  const [mvSign, setMvSign] = useState<MovementSign>("plus");
  const [mvQty, setMvQty] = useState("");
  const [mvMemo, setMvMemo] = useState("");
  const [mvSaving, setMvSaving] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const tid = ++toastCounterRef.current;
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== tid));
    }, 3000);
  }, []);

  const persistOperator = useCallback((name: string) => {
    try {
      localStorage.setItem("stock_operator_name", name);
    } catch {
      // プライベートモード等では無視
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stock_operator_name");
      if (saved) setOperatorName(saved);
    } catch {
      // ignore
    }
  }, []);

  const reloadItem = useCallback(async () => {
    const updated = await getItem(id);
    setItem(updated);
  }, [id]);

  useEffect(() => {
    getItem(id)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ---- 入庫ハンドラ ----
  const handleAddIncoming = async () => {
    if (!item) return;
    const qty = parseInt(inQty, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      showToast("本数は1以上の整数を入力してください", "error");
      return;
    }
    setInSaving(true);
    persistOperator(operatorName);
    try {
      await addIncoming(item.id, inDate, qty, operatorName, inMemo);
      await reloadItem();
      setInQty("");
      setInMemo("");
      showToast(`${qty}本を入庫しました`, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      showToast(msg, "error");
      console.error(err);
    } finally {
      setInSaving(false);
    }
  };

  // ---- 出荷ハンドラ ----
  const handleAddOutgoing = async () => {
    if (!item?.inventory) return;
    const qty = parseInt(outQty, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      showToast("本数は1以上の整数を入力してください", "error");
      return;
    }
    // バリデーション：対象在庫を超えないこと
    const inv = item.inventory;
    const available = getAvailableStock(inv);
    if (outType === "normal") {
      if (qty > available) {
        showToast(`使える在庫（${available}本）を超えています`, "error");
        return;
      }
    } else {
      const target = inv[outType] as number;
      if (qty > target) {
        showToast(
          `${SHIPMENT_TYPE_LABELS[outType]} の残数（${target}本）を超えています`,
          "error"
        );
        return;
      }
    }
    setOutSaving(true);
    persistOperator(operatorName);
    try {
      await addOutgoing(
        item.id,
        outDate,
        outType,
        qty,
        operatorName,
        outDestination,
        outMemo
      );
      await reloadItem();
      setOutQty("");
      setOutDestination("");
      setOutMemo("");
      showToast(`${qty}本を出荷しました`, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      showToast(msg, "error");
      console.error(err);
    } finally {
      setOutSaving(false);
    }
  };

  // ---- 移動ハンドラ ----
  const handleAddMovement = async () => {
    if (!item) return;
    const qty = parseInt(mvQty, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      showToast("本数は1以上の整数を入力してください", "error");
      return;
    }
    const delta = mvSign === "plus" ? qty : -qty;
    setMvSaving(true);
    persistOperator(operatorName);
    try {
      await addMovement(item.id, mvDate, mvField, delta, operatorName, mvMemo);
      await reloadItem();
      setMvQty("");
      setMvMemo("");
      showToast(
        `${MOVEMENT_FIELD_LABELS[mvField]} を ${mvSign === "plus" ? "+" : "-"}${qty} 移動しました`,
        "success"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      showToast(msg, "error");
      console.error(err);
    } finally {
      setMvSaving(false);
    }
  };

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
        <p className="text-sm mt-2">ネットワークエラーの可能性があります</p>
        <div className="flex flex-col gap-3 mt-6 max-w-xs mx-auto">
          <button
            onClick={() => window.location.reload()}
            className="bg-moss text-white rounded-xl py-3 px-6 text-sm font-bold min-h-[44px]"
          >
            再読み込み
          </button>
          <Link href="/" className="text-moss text-sm underline py-2">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const inv = item.inventory;
  const available = inv ? getAvailableStock(inv) : 0;
  const isLow = available <= 10;

  return (
    <div className="p-4 max-w-lg mx-auto pb-10">
      {/* 戻るリンク */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-moss hover:text-moss-light transition-colors mb-4 mt-1 py-2 px-1 -ml-1 min-h-[44px]"
      >
        <span className="text-base leading-none">&larr;</span>
        <span>在庫一覧に戻る</span>
      </Link>

      {/* 商品ヘッダー */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-sumi leading-snug">{item.name}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-sm text-sumi-light">
          {item.code && (
            <span className="bg-washi border border-border rounded px-1.5 py-0.5 text-xs">
              {item.code}
            </span>
          )}
          {item.volume && <span>{item.volume}</span>}
          {item.storage_location && <span>保管: {item.storage_location}</span>}
        </div>
      </div>

      {/* 使える在庫（大表示） */}
      <div
        className={[
          "rounded-2xl border p-5 mb-5 text-center",
          isLow ? "bg-amber-pale border-amber" : "bg-moss-pale border-moss/20",
        ].join(" ")}
      >
        <p
          className={[
            "text-xs font-medium tracking-wider mb-1",
            isLow ? "text-amber" : "text-moss",
          ].join(" ")}
        >
          使える在庫
        </p>
        <p
          className={[
            "text-6xl font-bold tabular-nums leading-none",
            isLow ? "text-amber" : "text-moss",
          ].join(" ")}
        >
          {available}
        </p>
        <p
          className={[
            "text-sm mt-1",
            isLow ? "text-amber opacity-80" : "text-moss opacity-70",
          ].join(" ")}
        >
          本
        </p>
        {isLow && (
          <p className="mt-2 text-xs text-amber font-medium bg-amber/10 rounded-lg px-3 py-1 inline-block">
            在庫残少 — 補充を確認してください
          </p>
        )}
      </div>

      {/* 操作エリア（タブ） */}
      <div className="mb-5">
        <div
          role="tablist"
          aria-label="在庫操作"
          className="grid grid-cols-3 gap-1 bg-washi border border-border rounded-xl p-1 mb-3"
        >
          {(
            [
              { key: "outgoing" as TabKey, label: "出荷" },
              { key: "movement" as TabKey, label: "移動" },
              { key: "incoming" as TabKey, label: "入庫" },
            ] as const
          ).map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() =>
                  setActiveTab(activeTab === t.key ? null : t.key)
                }
                className={[
                  "min-h-[44px] rounded-lg text-sm font-bold transition-colors",
                  active
                    ? "bg-moss text-white shadow-sm"
                    : "text-sumi-light hover:text-sumi hover:bg-moss/10",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 共通: 操作者 */}
        {activeTab !== null && (
        <div className="bg-white rounded-2xl border-2 border-moss/30 shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            {activeTab === "incoming" && (
              <>
                <FieldLabel required>日付</FieldLabel>
                <input
                  type="date"
                  value={inDate}
                  onChange={(e) => setInDate(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />
                <FieldLabel required>入庫本数</FieldLabel>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  placeholder="0"
                  className="w-full border-2 border-moss/30 focus:border-moss rounded-xl px-3 py-3 text-2xl text-center font-bold text-sumi outline-none transition-colors tabular-nums"
                />
                <FieldLabel>操作者</FieldLabel>
                <input
                  type="text"
                  placeholder="操作者の名前"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />
                <FieldLabel>メモ（任意）</FieldLabel>
                <input
                  type="text"
                  placeholder="メモ"
                  value={inMemo}
                  onChange={(e) => setInMemo(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />
                <button
                  onClick={handleAddIncoming}
                  disabled={inSaving}
                  className={primaryBtnClass(inSaving)}
                >
                  {inSaving ? <SpinnerLabel label="記録中..." /> : "入庫を記録する"}
                </button>
              </>
            )}

            {activeTab === "outgoing" && inv && (
              <>
                <FieldLabel required>日付</FieldLabel>
                <input
                  type="date"
                  value={outDate}
                  onChange={(e) => setOutDate(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <FieldLabel required>出荷種別</FieldLabel>
                <div className="grid grid-cols-1 gap-2">
                  {SHIPMENT_TYPES.map((k) => {
                    const selected = outType === k;
                    const remain =
                      k === "normal" ? available : (inv[k] as number);
                    const remainLabel =
                      k === "normal"
                        ? `使える在庫から: ${remain}本`
                        : `残: ${remain}本`;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setOutType(k)}
                        aria-pressed={selected}
                        className={[
                          "w-full text-left rounded-xl border-2 px-4 py-3 min-h-[56px] transition-all flex items-center justify-between gap-3",
                          selected
                            ? "border-moss bg-moss-pale"
                            : "border-border bg-washi hover:border-moss/40",
                        ].join(" ")}
                      >
                        <div className="flex flex-col">
                          <span
                            className={[
                              "text-sm font-semibold",
                              selected ? "text-moss" : "text-sumi",
                            ].join(" ")}
                          >
                            {SHIPMENT_TYPE_LABELS[k]}
                          </span>
                          <span className="text-xs text-sumi-light mt-0.5 tabular-nums">
                            {remainLabel}
                          </span>
                        </div>
                        <span
                          className={[
                            "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                            selected
                              ? "border-moss bg-moss"
                              : "border-border bg-white",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {selected && (
                            <span className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <FieldLabel required>出荷本数</FieldLabel>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={outQty}
                  onChange={(e) => setOutQty(e.target.value)}
                  placeholder="0"
                  className="w-full border-2 border-moss/30 focus:border-moss rounded-xl px-3 py-3 text-2xl text-center font-bold text-sumi outline-none transition-colors tabular-nums"
                />

                <FieldLabel>操作者</FieldLabel>
                <input
                  type="text"
                  placeholder="操作者の名前"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <FieldLabel>出荷先（任意）</FieldLabel>
                <input
                  type="text"
                  placeholder="出荷先"
                  value={outDestination}
                  onChange={(e) => setOutDestination(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <FieldLabel>メモ（任意）</FieldLabel>
                <input
                  type="text"
                  placeholder="メモ"
                  value={outMemo}
                  onChange={(e) => setOutMemo(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <button
                  onClick={handleAddOutgoing}
                  disabled={outSaving}
                  className={primaryBtnClass(outSaving)}
                >
                  {outSaving ? <SpinnerLabel label="記録中..." /> : "出荷を記録する"}
                </button>
              </>
            )}

            {activeTab === "movement" && inv && (
              <>
                <FieldLabel required>日付</FieldLabel>
                <input
                  type="date"
                  value={mvDate}
                  onChange={(e) => setMvDate(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <FieldLabel required>対象項目</FieldLabel>
                <select
                  value={mvField}
                  onChange={(e) => setMvField(e.target.value as MovementField)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                >
                  {MOVEMENT_FIELD_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.fields.map((f) => (
                        <option key={f} value={f}>
                          {MOVEMENT_FIELD_LABELS[f]}（現在: {inv[f] as number}本）
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <FieldLabel required>差分</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMvSign("plus")}
                    aria-pressed={mvSign === "plus"}
                    className={[
                      "min-h-[48px] rounded-xl border-2 text-sm font-bold transition-all",
                      mvSign === "plus"
                        ? "border-moss bg-moss text-white"
                        : "border-border bg-washi text-sumi-light hover:border-moss/40",
                    ].join(" ")}
                  >
                    ▲ 増加
                  </button>
                  <button
                    type="button"
                    onClick={() => setMvSign("minus")}
                    aria-pressed={mvSign === "minus"}
                    className={[
                      "min-h-[48px] rounded-xl border-2 text-sm font-bold transition-all",
                      mvSign === "minus"
                        ? "border-amber bg-amber text-white"
                        : "border-border bg-washi text-sumi-light hover:border-amber/40",
                    ].join(" ")}
                  >
                    ▼ 減少
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={mvQty}
                  onChange={(e) => setMvQty(e.target.value)}
                  placeholder="0"
                  className="w-full border-2 border-moss/30 focus:border-moss rounded-xl px-3 py-3 text-2xl text-center font-bold text-sumi outline-none transition-colors tabular-nums"
                />

                <FieldLabel>操作者</FieldLabel>
                <input
                  type="text"
                  placeholder="操作者の名前"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <FieldLabel>メモ（任意）</FieldLabel>
                <input
                  type="text"
                  placeholder="メモ"
                  value={mvMemo}
                  onChange={(e) => setMvMemo(e.target.value)}
                  className="w-full border border-border focus:border-moss rounded-xl px-3 py-2.5 text-sm text-sumi outline-none transition-colors bg-washi"
                />

                <button
                  onClick={handleAddMovement}
                  disabled={mvSaving}
                  className={primaryBtnClass(mvSaving)}
                >
                  {mvSaving ? <SpinnerLabel label="記録中..." /> : "移動を記録する"}
                </button>
              </>
            )}
          </div>
        </div>
        )}
      </div>

      {/* 在庫内訳（読み取り専用） */}
      {inv && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-5 shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-washi">
            <p className="text-xs font-semibold text-sumi-light tracking-wider">
              在庫内訳（読み取り専用）
            </p>
          </div>
          <div>
            {INVENTORY_SECTIONS.map((section, idx) => (
              <div
                key={section.title}
                className={idx > 0 ? "border-t border-border" : ""}
              >
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-[11px] font-medium text-sumi-light/80 tracking-wider">
                    {section.title}
                  </p>
                </div>
                <div className="divide-y divide-border/60">
                  {section.fields.map((field) => {
                    const value = inv[field];
                    return (
                      <div
                        key={field}
                        className="px-4 py-2.5 flex items-center justify-between"
                      >
                        <span className="text-sm text-sumi-light">
                          {INVENTORY_FIELD_LABELS[field]}
                        </span>
                        <span className="text-base font-semibold text-sumi tabular-nums">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ログリンク */}
      <Link
        href={`/items/${item.id}/log`}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-border text-sm text-sumi-light hover:border-moss hover:text-moss transition-all bg-white min-h-[48px]"
      >
        <span>出荷・移動・入庫の記録を見る</span>
        <span className="text-base leading-none">→</span>
      </Link>

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

// ---- 小物コンポーネント ----

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs text-sumi-light font-medium block">
      {children}
      {required && <span className="text-amber ml-1">必須</span>}
    </label>
  );
}

function primaryBtnClass(disabled: boolean): string {
  return [
    "w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all min-h-[56px]",
    disabled
      ? "bg-moss/40 text-white cursor-not-allowed"
      : "bg-moss text-white active:bg-moss-light hover:bg-moss-light",
  ].join(" ");
}

function SpinnerLabel({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {label}
    </span>
  );
}
