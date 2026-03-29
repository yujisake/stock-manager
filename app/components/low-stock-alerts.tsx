import type { ProductStockSummary } from "@/lib/types";
import Link from "next/link";

export function LowStockAlerts({
  products,
}: {
  products: ProductStockSummary[];
}) {
  const lowStock = products.filter(
    (p) => p.current_stock <= p.min_stock_threshold
  );

  if (lowStock.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <h2 className="mb-2 font-bold text-red-800">
        在庫少アラート（{lowStock.length}件）
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lowStock.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm hover:shadow-md"
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-500">{p.category}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">
                {p.current_stock}
                {p.unit}
              </p>
              <p className="text-xs text-gray-400">
                最低: {p.min_stock_threshold}
                {p.unit}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
