"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string) || null;
  const unit = formData.get("unit") as string;
  const min_stock_threshold = Number(formData.get("min_stock_threshold"));

  if (!name || !category || !unit) {
    return { success: false, error: "必須項目を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name,
    category,
    description,
    unit,
    min_stock_threshold,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateProduct(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string) || null;
  const unit = formData.get("unit") as string;
  const min_stock_threshold = Number(formData.get("min_stock_threshold"));

  if (!name || !category || !unit) {
    return { success: false, error: "必須項目を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name,
      category,
      description,
      unit,
      min_stock_threshold,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function createStockMovement(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const product_id = formData.get("product_id") as string;
  const movement_type = formData.get("movement_type") as string;
  const quantity = Number(formData.get("quantity"));
  const department = (formData.get("department") as string) || null;
  const operator_name = formData.get("operator_name") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!product_id || !movement_type || !quantity || !operator_name) {
    return { success: false, error: "必須項目を入力してください" };
  }

  if (quantity <= 0) {
    return { success: false, error: "数量は1以上を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("stock_movements").insert({
    product_id,
    movement_type,
    quantity,
    department,
    operator_name,
    notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/products/${product_id}`);
  revalidatePath(`/products/${product_id}/stock`);
  revalidatePath("/");
  return { success: true };
}
