import type { ProductStockSummary } from "@/lib/types";
import Link from "next/link";

export function ProductTable({
  products,
}: {
  products: ProductStockSummary[];
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        商品が登録されていません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium">商品名</th>
            <th className="px-4 py-3 font-medium">カテゴリ</th>
            <th className="px-4 py-3 font-medium text-right">現在庫</th>
            <th className="px-4 py-3 font-medium text-right">入庫</th>
            <th className="px-4 py-3 font-medium text-right">出庫</th>
            <th className="px-4 py-3 font-medium text-right">不良品</th>
            <th className="px-4 py-3 font-medium">状態</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const isLow = p.current_stock <= p.min_stock_threshold;
            return (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/products/${p.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-right font-bold">
                  {p.current_stock}
                  {p.unit}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {p.total_in}
                </td>
                <td className="px-4 py-3 text-right text-blue-600">
                  {p.total_out}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {p.total_defective}
                </td>
                <td className="px-4 py-3">
                  {isLow ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      在庫少
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      正常
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
