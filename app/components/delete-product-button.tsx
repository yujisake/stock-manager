"use client";

import { deleteProduct } from "@/app/actions/product-actions";
import { useTransition } from "react";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("この商品を削除しますか？入出庫履歴は保持されます。")) {
      return;
    }
    startTransition(async () => {
      await deleteProduct(productId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}
