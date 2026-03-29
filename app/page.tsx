import { createClient } from "@/lib/supabase/server";
import type { ProductStockSummary } from "@/lib/types";
import { LowStockAlerts } from "./components/low-stock-alerts";
import { CategoryFilter } from "./components/category-filter";
import { ProductTable } from "./components/product-table";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("product_stock_summary").select("*");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("name");

  const products: ProductStockSummary[] = error ? [] : (data ?? []);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">在庫ダッシュボード</h1>
      <LowStockAlerts products={products} />
      <CategoryFilter />
      <ProductTable products={products} />
    </>
  );
}
