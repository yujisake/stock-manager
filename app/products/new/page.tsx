import { createProduct } from "@/app/actions/product-actions";
import { ProductForm } from "@/app/components/product-form";

export default function NewProductPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">商品登録</h1>
      <div className="rounded-lg border bg-white p-6">
        <ProductForm action={createProduct} />
      </div>
    </>
  );
}
