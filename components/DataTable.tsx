import { inr } from "@/lib/finance";

type Row = {
  txn_date: string;
  type: string;
  amount: number;
  category: string | null;
  description: string | null;
  source: string;
};

export default function DataTable({ rows, title }: { rows: Row[]; title: string }) {
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
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-masala-brown/50 py-6">
                  No entries yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.txn_date).toLocaleDateString("en-IN")}</td>
                <td className="capitalize">{r.type}</td>
                <td>{r.category || "—"}</td>
                <td>{r.description || "—"}</td>
                <td className="font-medium">{inr(r.amount)}</td>
                <td className="text-masala-brown/50 text-xs">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
