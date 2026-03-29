import type { StockMovement } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  in: "入庫",
  out: "出庫",
  defective: "不良品",
};

const TYPE_COLORS: Record<string, string> = {
  in: "text-green-600",
  out: "text-blue-600",
  defective: "text-red-600",
};

export function MovementHistory({
  movements,
}: {
  movements: StockMovement[];
}) {
  if (movements.length === 0) {
    return <p className="text-sm text-gray-500">履歴はまだありません</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="px-3 py-2 font-medium">日時</th>
            <th className="px-3 py-2 font-medium">種別</th>
            <th className="px-3 py-2 font-medium text-right">数量</th>
            <th className="px-3 py-2 font-medium">部門</th>
            <th className="px-3 py-2 font-medium">操作者</th>
            <th className="px-3 py-2 font-medium">備考</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="px-3 py-2 text-gray-600">
                {new Date(m.created_at).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className={`px-3 py-2 font-medium ${TYPE_COLORS[m.movement_type]}`}>
                {TYPE_LABELS[m.movement_type]}
              </td>
              <td className="px-3 py-2 text-right">{m.quantity}</td>
              <td className="px-3 py-2 text-gray-600">
                {m.department || "-"}
              </td>
              <td className="px-3 py-2">{m.operator_name}</td>
              <td className="px-3 py-2 text-gray-500">{m.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
