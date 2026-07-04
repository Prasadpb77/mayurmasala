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
    <div className="card p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Source</th>
              {(onEdit || onDelete) && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={onEdit || onDelete ? 7 : 6} className="text-center text-masala-brown/50 py-6">
                  No entries yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="whitespace-nowrap">{new Date(r.txn_date).toLocaleDateString("en-IN")}</td>
                <td className="capitalize whitespace-nowrap">{r.type}</td>
                <td className="whitespace-nowrap">{r.category || "—"}</td>
                <td className="max-w-[200px] truncate">{r.description || "—"}</td>
                <td className="font-medium whitespace-nowrap">{inr(r.amount)}</td>
                <td className="text-masala-brown/50 text-xs whitespace-nowrap">{r.source}</td>
                {(onEdit || onDelete) && (
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1.5 rounded-md hover:bg-masala-gold/20 text-masala-brown/60 hover:text-masala-gold transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(r)}
                          className="p-1.5 rounded-md hover:bg-masala-red/10 text-masala-brown/60 hover:text-masala-red transition-colors"
                          title="Delete"
                        >
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