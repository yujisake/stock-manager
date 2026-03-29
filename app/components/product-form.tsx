"use client";

import { useActionState } from "react";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import type { ActionResult } from "@/app/actions/product-actions";

const UNITS = ["本", "ケース", "リットル", "個"];

export function ProductForm({
  action,
  defaultValues,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: Product;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          商品名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          カテゴリ <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaultValues?.category ?? "日本酒"}
          className="w-full rounded-md border px-3 py-2"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="unit" className="mb-1 block text-sm font-medium">
            単位 <span className="text-red-500">*</span>
          </label>
          <select
            id="unit"
            name="unit"
            required
            defaultValue={defaultValues?.unit ?? "本"}
            className="w-full rounded-md border px-3 py-2"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="min_stock_threshold"
            className="mb-1 block text-sm font-medium"
          >
            最低在庫数 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="min_stock_threshold"
            name="min_stock_threshold"
            required
            min={0}
            defaultValue={defaultValues?.min_stock_threshold ?? 5}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending
          ? "保存中..."
          : defaultValues
            ? "更新する"
            : "登録する"}
      </button>
    </form>
  );
}
