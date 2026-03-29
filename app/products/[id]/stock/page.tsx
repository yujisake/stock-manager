import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductStockSummary, StockMovement } from "@/lib/types";
import { StockMovementForm } from "@/app/components/stock-movement-form";
import { MovementHistory } from "@/app/components/movement-history";

export default async function StockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [productRes, summaryRes, movementsRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("product_stock_summary")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const product = productRes.data as Product | null;
  if (!product) notFound();

  const summary = summaryRes.data as ProductStockSummary | null;
  const currentStock = summary?.current_stock ?? 0;
  const movements = (movementsRes.data as StockMovement[]) ?? [];

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Link
          href={`/products/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          商品詳細に戻る
        </Link>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-6">
        <StockMovementForm
          productId={id}
          productName={product.name}
          currentStock={currentStock}
          unit={product.unit}
        />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-bold">直近の記録</h2>
        <MovementHistory movements={movements} />
      </div>
    </div>
  );
}
