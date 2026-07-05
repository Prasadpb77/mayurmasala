import { inr } from "@/lib/finance";
import { Pencil, Trash2 } from "lucide-react";

type Row = {
  id?: number;
  txn_date: string;
  type: string;
  amount: number;
  category: string | null;
  description: string | null;
  source: string;
};

export default function DataTable({
  rows,
  title,
  onEdit,
  onDelete,
}: {
  rows: Row[];
  title: string;
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => void;
}) {
  return (
    <div className="card p-4 md:p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="-mx-4 md:-mx-0 overflow-x-auto">
        <table className="data-table w-full min-w-[500px] md:min-w-0">
          <thead>
            <tr>
              <th className="px-3 md:px-3">Date</th>
              <th className="px-3 md:px-3">Type</th>
              <th className="px-3 md:px-3">Category</th>
              <th className="px-3 md:px-3">Amount</th>
              {(onEdit || onDelete) && <th className="px-3 md:px-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={onEdit || onDelete ? 5 : 4} className="text-center text-masala-brown/50 py-6 px-3">
                  No entries yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="px-3 md:px-3 whitespace-nowrap text-sm">{new Date(r.txn_date).toLocaleDateString("en-IN")}</td>
                <td className="px-3 md:px-3 capitalize whitespace-nowrap text-sm">{r.type}</td>
                <td className="px-3 md:px-3 whitespace-nowrap text-sm max-w-[120px] truncate">{r.category || "—"}</td>
                <td className="px-3 md:px-3 font-medium whitespace-nowrap text-sm">{inr(r.amount)}</td>
                {(onEdit || onDelete) && (
                  <td className="px-3 md:px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button onClick={() => onEdit(r)} className="p-1.5 rounded-md hover:bg-masala-gold/20 text-masala-brown/60 hover:text-masala-gold transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(r)} className="p-1.5 rounded-md hover:bg-masala-red/10 text-masala-brown/60 hover:text-masala-red transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}