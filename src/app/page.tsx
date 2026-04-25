"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllItems } from "@/lib/stock-api";
import { getAvailableStock, INVENTORY_FIELD_LABELS } from "@/lib/types";
import type { ItemWithInventory } from "@/lib/types";

export default function DashboardPage() {
  const [items, setItems] = useState<ItemWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAllItems()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-moss border-t-transparent rounded-full animate-spin" />
        <p className="text-sumi-light text-sm">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sumi-light">
        <p className="text-4xl mb-4 opacity-30">!</p>
        <p className="text-lg font-medium">データの取得に失敗しました</p>
        <p className="mt-2 text-sm">ネットワーク接続を確認してください</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sumi-light">
        <p className="text-4xl mb-4 opacity-30">蔵</p>
        <p className="text-lg font-medium">商品が登録されていません</p>
        <p className="mt-2 text-sm">Supabase にテーブルとデータを作成してください</p>
      </div>
    );
  }

  const lowItems = items.filter((item) => {
    const inv = item.inventory;
    return inv ? getAvailableStock(inv) <= 10 : false;
  });

  return (
    <div className="p-4 max-w-4xl mx-auto pb-8">
      {/* ページヘッダー */}
      <div className="flex items-baseline justify-between mb-5 mt-2">
        <h1 className="text-lg font-bold text-sumi tracking-wide">在庫一覧</h1>
        <span className="text-xs text-sumi-light">{items.length} 件</span>
      </div>

      {/* 残少アラートバナー */}
      {lowItems.length > 0 && (
        <div className="mb-5 bg-amber-pale border border-amber rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-amber text-lg leading-none">!</span>
          <div>
            <p className="text-sm font-semibold text-amber">残少アラート</p>
            <p className="text-xs text-amber opacity-80 mt-0.5">
              {lowItems.map((i) => i.name).join("・")} の在庫が 10 本以下です
            </p>
          </div>
        </div>
      )}

      {/* カードリスト */}
      <div className="space-y-3">
        {items.map((item) => {
          const inv = item.inventory;
          const available = inv ? getAvailableStock(inv) : 0;
          const isLow = available <= 10;

          return (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className={[
                "block bg-white rounded-2xl border transition-all duration-150",
                "active:scale-[0.98] hover:shadow-md",
                isLow
                  ? "border-amber shadow-sm shadow-amber/20"
                  : "border-border hover:border-moss/40",
              ].join(" ")}
            >
              <div className="p-4">
                {/* 商品名・在庫数 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-sumi text-base leading-snug">{item.name}</h2>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-xs text-sumi-light">
                      {item.code && <span>{item.code}</span>}
                      {item.volume && (
                        <>
                          {item.code && <span className="opacity-40">|</span>}
                          <span>{item.volume}</span>
                        </>
                      )}
                      {item.storage_location && (
                        <>
                          <span className="opacity-40">|</span>
                          <span>保管: {item.storage_location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 在庫数バッジ */}
                  <div
                    className={[
                      "flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[64px]",
                      isLow ? "bg-amber-pale" : "bg-moss-pale",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "text-3xl font-bold leading-none tabular-nums",
                        isLow ? "text-amber" : "text-moss",
                      ].join(" ")}
                    >
                      {available}
                    </span>
                    <span
                      className={[
                        "text-xs mt-0.5 font-medium",
                        isLow ? "text-amber opacity-80" : "text-moss opacity-70",
                      ].join(" ")}
                    >
                      本
                    </span>
                  </div>
                </div>

                {/* 内訳バー */}
                {inv && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-x-4 gap-y-1">
                    {[
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_frame_shop,
                        value: inv.reserve_frame_shop,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_frame_online,
                        value: inv.reserve_frame_online,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_frame_liquor,
                        value: inv.reserve_frame_liquor,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_shop,
                        value: inv.reserve_shop,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_online,
                        value: inv.reserve_online,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_domestic,
                        value: inv.reserve_domestic,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_export,
                        value: inv.reserve_export,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.defective_ok,
                        value: inv.defective_ok,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.reserve_damaged,
                        value: inv.reserve_damaged,
                      },
                      {
                        label: INVENTORY_FIELD_LABELS.defective_ng,
                        value: inv.defective_ng,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-sumi-light opacity-70">{label}</span>
                        <span className="font-medium text-sumi-light tabular-nums">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* タップヒント */}
              <div className="px-4 pb-3 -mt-1">
                <span className="text-xs text-moss opacity-50">タップして編集 →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
