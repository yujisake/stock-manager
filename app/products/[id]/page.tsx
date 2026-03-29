import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductStockSummary,
  StockByDepartment,
  StockMovement,
} from "@/lib/types";
import { QrCodeDisplay } from "@/app/components/qr-code-display";
import { StockBreakdown } from "@/app/components/stock-breakdown";
import { MovementHistory } from "@/app/components/movement-history";
import { DeleteProductButton } from "@/app/components/delete-product-button";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [productRes, summaryRes, departmentsRes, movementsRes] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase
        .from("product_stock_summary")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("stock_by_department")
        .select("*")
        .eq("product_id", id),
      supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const product = productRes.data as Product | null;
  if (!product) notFound();

  const summary = (summaryRes.data as ProductStockSummary | null) ?? {
    total_in: 0,
    total_out: 0,
    total_defective: 0,
    current_stock: 0,
  };
  const departments = (departmentsRes.data as StockByDepartment[]) ?? [];
  const movements = (movementsRes.data as StockMovement[]) ?? [];

  const isLow = summary.current_stock <= product.min_stock_threshold;

  return (
    <>
      {/* ヘッダー */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-500">
            {product.category}
            {product.description && ` - ${product.description}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/products/${id}/stock`}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            入出庫を記録
          </Link>
          <Link
            href={`/products/${id}/edit`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            編集
          </Link>
          <DeleteProductButton productId={id} />
        </div>
      </div>

      {/* 在庫サマリー */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div
          className={`rounded-lg border p-4 ${isLow ? "border-red-300 bg-red-50" : "bg-white"}`}
        >
          <p className="text-sm text-gray-500">現在庫</p>
          <p
            className={`text-3xl font-bold ${isLow ? "text-red-600" : ""}`}
          >
            {summary.current_stock}
            <span className="text-base font-normal text-gray-500">
              {product.unit}
            </span>
          </p>
          {isLow && (
            <p className="mt-1 text-xs text-red-500">
              最低在庫数 {product.min_stock_threshold}
              {product.unit} を下回っています
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">総入庫</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.total_in}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">総出庫</p>
          <p className="text-2xl font-bold text-blue-600">
            {summary.total_out}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">不良品</p>
          <p className="text-2xl font-bold text-red-600">
            {summary.total_defective}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* 部門別内訳 */}
        <div className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 font-bold">部門別内訳</h2>
          <StockBreakdown departments={departments} unit={product.unit} />
        </div>

        {/* QRコード */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-bold no-print">QRコード</h2>
          <QrCodeDisplay productId={id} productName={product.name} />
        </div>
      </div>

      {/* 入出庫履歴 */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-bold">入出庫履歴（直近50件）</h2>
        <MovementHistory movements={movements} />
      </div>
    </>
  );
}
