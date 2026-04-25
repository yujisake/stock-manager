// このルートは /items/[id]/log に統合されました。
// 既存のブックマークや外部リンクのために、新URLへリダイレクトします。
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function LegacyHistoryRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/items/${id}/log`);
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-moss border-t-transparent rounded-full animate-spin" />
      <p className="text-sumi-light text-sm">ログ画面に移動しています...</p>
    </div>
  );
}
