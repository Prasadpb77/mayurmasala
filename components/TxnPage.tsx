"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/DataTable";
import { inr } from "@/lib/finance";

type Txn = "sale" | "purchase" | "expense";

export default function TxnPage({ type, title }: { type: Txn; title: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [range, setRange] = useState<"month" | "year" | "fy" | "all">("month");
  const [form, setForm] = useState({ amount: "", category: "", description: "", txn_date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);

  function rangeStart() {
    const now = new Date();
    if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    if (range === "year") return new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    if (range === "fy") {
      const y = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
      return `${y}-04-01`;
    }
    return null;
  }

  async function load() {
    let q = supabase.from("transactions").select("*").eq("type", type).order("txn_date", { ascending: false });
    const start = rangeStart();
    if (start) q = q.gte("txn_date", start);
    const { data } = await q;
    setRows(data || []);
    setTotal((data || []).reduce((s, r) => s + Number(r.amount), 0));
  }

  useEffect(() => { load(); }, [range]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({
      type,
      amount: Number(form.amount),
      category: form.category || null,
      description: form.description || null,
      txn_date: form.txn_date,
      source: "web",
      created_by: user?.id,
    });
    setForm({ amount: "", category: "", description: "", txn_date: new Date().toISOString().slice(0, 10) });
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold capitalize">{title}</h1>
        <div className="flex gap-2">
          {(["month", "year", "fy", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                range === r ? "bg-masala-red text-white border-masala-red" : "border-masala-brown/20 text-masala-brown/70"
              }`}
            >
              {r === "fy" ? "Financial Year" : r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="card p-5 space-y-3 md:col-span-1">
          <h3 className="font-semibold">Add {title.slice(0, -1)}</h3>
          <div>
            <label className="text-sm font-medium">Amount (₹)</label>
            <input className="input mt-1" type="number" required min="0" step="0.01"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <input className="input mt-1" type="date" required
              value={form.txn_date} onChange={(e) => setForm({ ...form, txn_date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <input className="input mt-1" placeholder="e.g. Garam Masala, Rent..."
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input className="input mt-1" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : `Add ${title.slice(0, -1)}`}
          </button>
        </form>

        <div className="md:col-span-2 space-y-4">
          <div className="kpi-card">
            <p className="text-xs uppercase tracking-wide text-masala-gold/90 font-semibold">
              Total ({range === "fy" ? "Financial Year" : range})
            </p>
            <p className="text-3xl font-bold mt-1">{inr(total)}</p>
          </div>
          <DataTable rows={rows} title={`${title} — ${rows.length} entries`} />
        </div>
      </div>
    </div>
  );
}
