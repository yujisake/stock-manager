import type { StockByDepartment } from "@/lib/types";

export function StockBreakdown({
  departments,
  unit,
}: {
  departments: StockByDepartment[];
  unit: string;
}) {
  if (departments.length === 0) {
    return (
      <p className="text-sm text-gray-500">部門別データはまだありません</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left">
          <th className="px-3 py-2 font-medium">部門</th>
          <th className="px-3 py-2 font-medium text-right">入庫</th>
          <th className="px-3 py-2 font-medium text-right">出庫</th>
          <th className="px-3 py-2 font-medium text-right">不良品</th>
          <th className="px-3 py-2 font-medium text-right">在庫</th>
        </tr>
      </thead>
      <tbody>
        {departments.map((d) => (
          <tr key={d.department} className="border-b">
            <td className="px-3 py-2">{d.department}</td>
            <td className="px-3 py-2 text-right text-green-600">
              {d.dept_in}
            </td>
            <td className="px-3 py-2 text-right text-blue-600">
              {d.dept_out}
            </td>
            <td className="px-3 py-2 text-right text-red-600">
              {d.dept_defective}
            </td>
            <td className="px-3 py-2 text-right font-bold">
              {d.dept_stock}
              {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
