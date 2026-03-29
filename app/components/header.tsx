import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-white no-print">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          在庫管理
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ダッシュボード
          </Link>
          <Link
            href="/products/new"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            商品登録
          </Link>
        </nav>
      </div>
    </header>
  );
}
