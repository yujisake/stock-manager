import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "@/app/actions/product-actions";
import { ProductForm } from "@/app/components/product-form";
import type { Product } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const boundAction = updateProduct.bind(null, id);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">商品編集</h1>
      <div className="rounded-lg border bg-white p-6">
        <ProductForm
          action={boundAction}
          defaultValues={product as Product}
        />
      </div>
    </>
  );
}
