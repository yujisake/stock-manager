"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStockMovement } from "@/app/actions/product-actions";
import type { ActionResult } from "@/app/actions/product-actions";
import { DEPARTMENTS } from "@/lib/types";

const MOVEMENT_TYPES = [
  { value: "in", label: "入庫", color: "bg-green-600 hover:bg-green-700" },
  { value: "out", label: "出庫", color: "bg-blue-600 hover:bg-blue-700" },
  {
    value: "defective",
    label: "不良品",
    color: "bg-red-600 hover:bg-red-700",
  },
] as const;

export function StockMovementForm({
  productId,
  productName,
  currentStock,
  unit,
}: {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string;
}) {
  const [state, formAction, isPending] = useActionState(createStockMovement, {
    success: false,
  });

  const formRef = useRef<HTMLFormElement>(null);
  const operatorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("operator_name");
    if (saved && operatorRef.current) {
      operatorRef.current.value = saved;
    }
  }, []);

  useEffect(() => {
    if (state.success && formRef.current) {
      const operator = formRef.current.querySelector<HTMLInputElement>(
        'input[name="operator_name"]'
      );
      if (operator) {
        localStorage.setItem("operator_name", operator.value);
      }
      formRef.current.reset();
      if (operator) {
        operator.value = localStorage.getItem("operator_name") ?? "";
      }
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="product_id" value={productId} />

      {state.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          記録しました
        </div>
      )}

      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* 商品情報 */}
      <div className="rounded-lg bg-gray-100 p-4 text-center">
        <p className="text-lg font-bold">{productName}</p>
        <p className="text-3xl font-bold">
          {currentStock}
          <span className="text-base font-normal text-gray-500">{unit}</span>
        </p>
      </div>

      {/* 種別選択 */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          種別 <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {MOVEMENT_TYPES.map((type) => (
            <label key={type.value} className="cursor-pointer">
              <input
                type="radio"
                name="movement_type"
                value={type.value}
                required
                className="peer hidden"
              />
              <div
                className={`rounded-lg border-2 border-transparent p-3 text-center text-sm font-medium text-gray-700 transition-colors peer-checked:border-gray-900 peer-checked:text-white peer-checked:${type.color}`}
              >
                {type.label}
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 数量 */}
      <div>
        <label htmlFor="quantity" className="mb-1 block text-sm font-medium">
          数量 <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          required
          min={1}
          className="w-full rounded-md border px-3 py-3 text-lg"
          inputMode="numeric"
        />
      </div>

      {/* 部門 */}
      <div>
        <label htmlFor="department" className="mb-1 block text-sm font-medium">
          部門
        </label>
        <select
          id="department"
          name="department"
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">選択なし</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* 操作者 */}
      <div>
        <label
          htmlFor="operator_name"
          className="mb-1 block text-sm font-medium"
        >
          操作者名 <span className="text-red-500">*</span>
        </label>
        <input
          ref={operatorRef}
          type="text"
          id="operator_name"
          name="operator_name"
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {/* 備考 */}
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          備考
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "記録中..." : "記録する"}
      </button>
    </form>
  );
}
