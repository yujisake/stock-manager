"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCodeDisplay({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}/stock`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="print-only hidden">
        <p className="mb-2 text-center text-lg font-bold">{productName}</p>
      </div>
      <QRCodeSVG value={url} size={160} />
      <p className="text-xs text-gray-500 no-print">
        スキャンで入出庫ページへ
      </p>
      <button
        onClick={() => window.print()}
        className="mt-1 rounded-md border px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 no-print"
      >
        QRコードを印刷
      </button>
    </div>
  );
}
