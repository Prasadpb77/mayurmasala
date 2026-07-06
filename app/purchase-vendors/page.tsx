"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import { inr } from "@/lib/finance";
import { Plus, X, Check, Edit2, Trash2, Eye } from "lucide-react";
import NameDropdown from "@/components/NameDropdown";

type VendorRow = {
  id: string;
  vendor_name: string;
  whatsapp_number: string | null;
  description: string | null;
  bill_no: string | null;
  amount: number;
  paid_amount: number;
  status: "paid" | "unpaid" | "partial";
  date: string;
  created_at: string;
};

export default function PurchaseVendorsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [rows, setRows] = useState<VendorRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingVendor, setViewingVendor] = useState<string | null>(null);
  const [form, setForm] = useState({
    vendor_name: "",
    whatsapp_number: "",
    description: "",
    bill_no: "",
    amount: "",
    paid_amount: "",
    status: "unpaid" as "paid" | "unpaid" | "partial",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastEntry, setLastEntry] = useState<VendorRow | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-fill vendor details when vendor name changes
  useEffect(() => {
    if (form.vendor_name && rows.length > 0) {
      const existingVendor = rows.find(r => r.vendor_name === form.vendor_name);
      if (existingVendor) {
        setForm(prev => ({
          ...prev,
          whatsapp_number: existingVendor.whatsapp_number || prev.whatsapp_number,
        }));
      }
    }
  }, [form.vendor_name, rows]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return router.replace("/login");
      load();
    });
  }, []);

  async function load() {
    const { data } = await supabase
      .from("purchase_vendors")
      .select("*")
      .order("date", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor_name || (!form.amount && !form.paid_amount)) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const paidAmt = Number(form.paid_amount) || 0;
    const totalAmt = Number(form.amount) || 0;
    let status: "paid" | "unpaid" | "partial" = "unpaid";
    if (paidAmt >= totalAmt && totalAmt > 0) status = "paid";
    else if (paidAmt > 0) status = "partial";
    else if (totalAmt > 0) status = "unpaid";

    if (editingId) {
      const { error } = await supabase
        .from("purchase_vendors")
        .update({
          vendor_name: form.vendor_name.trim(),
          whatsapp_number: form.whatsapp_number.trim() || null,
          description: form.description.trim() || null,
          bill_no: form.bill_no.trim() || null,
          amount: totalAmt,
          paid_amount: paidAmt,
          status,
          date: form.date,
        })
        .eq("id", editingId);

      if (error) {
        alert(`Failed to update: ${error.message}`);
        setSaving(false);
        return;
      }
      setEditingId(null);
    } else {
      const { data: insertedData, error: insertError } = await supabase
        .from("purchase_vendors")
        .insert({
          vendor_name: form.vendor_name.trim(),
          whatsapp_number: form.whatsapp_number.trim() || null,
          description: form.description.trim() || null,
          bill_no: form.bill_no.trim() || null,
          amount: totalAmt,
          paid_amount: paidAmt,
          status,
          date: form.date,
          created_by: user?.id,
        })
        .select();

      if (insertError) {
        alert(`Failed to save: ${insertError.message}`);
        setSaving(false);
        return;
      }

      if (insertedData && insertedData.length > 0) {
        setLastEntry(insertedData[0]);
        setShowSuccess(true);
      }
    }

    setForm({
      vendor_name: "",
      whatsapp_number: "",
      description: "",
      bill_no: "",
      amount: "",
      paid_amount: "",
      status: "unpaid",
      date: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    await load();
  }

  function startEdit(row: VendorRow) {
    setEditingId(row.id);
    setForm({
      vendor_name: row.vendor_name,
      whatsapp_number: row.whatsapp_number || "",
      description: row.description || "",
      bill_no: row.bill_no || "",
      amount: String(row.amount),
      paid_amount: String(row.paid_amount),
      status: row.status,
      date: row.date,
    });
    setShowAdd(true);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const { error } = await supabase.from("purchase_vendors").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    await load();
  }

  // Vendor-wise summary
  const vendorMap = new Map<string, { total: number; paid: number; count: number }>();
  rows.forEach((r) => {
    const v = vendorMap.get(r.vendor_name) || { total: 0, paid: 0, count: 0 };
    v.total += r.amount;
    v.paid += r.paid_amount;
    v.count += 1;
    vendorMap.set(r.vendor_name, v);
  });

  const vendorSummaries = Array.from(vendorMap.entries()).map(([name, data]) => ({
    name,
    total: data.total,
    paid: data.paid,
    remaining: data.total - data.paid,
    count: data.count,
  })).sort((a, b) => b.remaining - a.remaining);

  const uniqueVendors = Array.from(new Set(rows.map((r) => r.vendor_name))).sort();
  const filteredRows = viewingVendor ? rows.filter((r) => r.vendor_name === viewingVendor) : rows;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-masala-brown/50">Loading...</p></div>;

  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Purchase Vendors</h1>
            <p className="text-masala-brown/60 text-sm">Track purchases from vendors</p>
          </div>
          <button onClick={() => { setShowAdd(true); setEditingId(null); }} className="btn-primary flex items-center gap-1">
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {/* Vendor-wise widgets */}
        {vendorSummaries.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendorSummaries.map((v) => (
              <div key={v.name} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-masala-gradient flex items-center justify-center text-masala-gold font-bold">
                      {v.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-xs text-masala-brown/50">{v.count} transactions</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-masala-brown/60">Total</span>
                    <span className="font-medium">{inr(v.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masala-brown/60">Paid</span>
                    <span className="font-medium text-green-700">{inr(v.paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masala-brown/60">Remaining</span>
                    <span className={`font-medium ${v.remaining > 0 ? "text-masala-red" : "text-green-600"}`}>
                      {inr(v.remaining)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setViewingVendor(viewingVendor === v.name ? null : v.name)}
                    className="flex-1 text-xs py-2 rounded-lg border border-masala-brown/20 hover:bg-masala-brown/5 flex items-center justify-center gap-1"
                  >
                    <Eye size={14} /> {viewingVendor === v.name ? "Show All" : "View History"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit entry modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => { setShowAdd(false); setEditingId(null); }}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-masala-cream w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{editingId ? "Edit Entry" : "Add Purchase Vendor Entry"}</h3>
                <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="p-1 hover:text-masala-red"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Vendor Name</label>
                  <div className="mt-1">
                    <NameDropdown
                      names={uniqueVendors}
                      value={form.vendor_name}
                      onChange={(value) => setForm({ ...form, vendor_name: value })}
                      placeholder="Enter or select vendor"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">WhatsApp Number (optional)</label>
                  <input className="input mt-1" type="tel" placeholder="e.g. 9876543210"
                    value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <textarea className="input mt-1" rows={2} placeholder="What was purchased..."
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Bill No. (optional)</label>
                  <input className="input mt-1" type="text" placeholder="e.g. INV-001"
                    value={form.bill_no} onChange={(e) => setForm({ ...form, bill_no: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Total Amount (₹)</label>
                  <input className="input mt-1" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  <p className="text-xs text-masala-brown/50 mt-1">Leave empty or 0 if only recording a payment</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Paid Amount (₹) *</label>
                  <input className="input mt-1" type="number" min="0" step="0.01" placeholder="0.00" required
                    value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
                </div>

                {form.vendor_name && (() => {
                  const vendorRows = rows.filter(r => r.vendor_name === form.vendor_name);
                  const total = vendorRows.reduce((sum, r) => sum + r.amount, 0);
                  const paid = vendorRows.reduce((sum, r) => sum + r.paid_amount, 0);
                  const remaining = total - paid;
                  if (remaining > 0) {
                    return (
                      <div className="p-3 bg-masala-red/5 border border-masala-red/20 rounded-lg">
                        <p className="text-xs text-masala-brown/60">Previous Balance</p>
                        <p className="text-lg font-bold text-masala-red">₹{remaining.toLocaleString("en-IN")}</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(["unpaid", "partial", "paid"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, status: s })}
                        className={`py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                          form.status === s
                            ? s === "paid"
                              ? "border-green-600 bg-green-50 text-green-700"
                              : s === "partial"
                              ? "border-yellow-600 bg-yellow-50 text-yellow-700"
                              : "border-masala-red bg-masala-red/5 text-masala-red"
                            : "border-masala-brown/10 text-masala-brown/60"
                        }`}
                      >
                        {s === "paid" ? "✓ Paid" : s === "partial" ? "◐ Partial" : "⏳ Unpaid"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input className="input mt-1" type="date" required
                    value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>

                <button className="btn-primary w-full py-3" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Entry" : "Add Entry"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Success message after adding entry */}
        {showSuccess && lastEntry && (
          <div className="card p-4 border-2 border-green-200 bg-green-50/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check size={20} className="text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Entry added successfully!</h3>
                <p className="text-sm text-green-700 mb-3">
                  Purchase from {lastEntry.vendor_name} for ₹{lastEntry.amount.toLocaleString("en-IN")}
                  {lastEntry.status === "unpaid" && " • Status: Unpaid"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All transactions table */}
        {filteredRows.length > 0 && (
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                {viewingVendor ? `${viewingVendor} - Transaction History` : "All Purchase Entries"}
              </h3>
              {viewingVendor && (
                <button onClick={() => setViewingVendor(null)} className="text-sm text-masala-brown/60 hover:text-masala-brown">
                  Show All
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="px-3">Date</th>
                    <th className="px-3">Vendor</th>
                    <th className="px-3">Description</th>
                    <th className="px-3 text-right">Amount</th>
                    <th className="px-3 text-right">Paid</th>
                    <th className="px-3 text-right">Balance</th>
                    <th className="px-3 text-center">Status</th>
                    <th className="px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => {
                    const balance = r.amount - r.paid_amount;
                    return (
                      <tr key={r.id}>
                        <td className="px-3 whitespace-nowrap text-sm">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-3 text-sm font-medium">{r.vendor_name}</td>
                        <td className="px-3 text-sm max-w-[150px] truncate">{r.description || "—"}</td>
                        <td className="px-3 text-right whitespace-nowrap text-sm">{inr(r.amount)}</td>
                        <td className="px-3 text-right whitespace-nowrap text-sm text-green-700">{inr(r.paid_amount)}</td>
                        <td className="px-3 text-right whitespace-nowrap text-sm font-medium text-masala-red">{inr(balance)}</td>
                        <td className="px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "paid" ? "bg-green-50 text-green-700" : r.status === "partial" ? "bg-yellow-50 text-yellow-700" : "bg-masala-red/10 text-masala-red"
                          }`}>
                            {r.status === "paid" ? "✓ Paid" : r.status === "partial" ? "◐ Partial" : "⏳ Unpaid"}
                          </span>
                        </td>
                        <td className="px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(r)}
                              className="p-1.5 rounded-md hover:bg-blue-50 text-masala-brown/60 hover:text-blue-700"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteEntry(r.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-masala-brown/60 hover:text-masala-red"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length === 0 && (
          <div className="text-center py-12 text-masala-brown/50">
            <p>No purchase vendor entries yet.</p>
            <button onClick={() => { setShowAdd(true); setEditingId(null); }} className="btn-primary mt-4 inline-flex items-center gap-1">
              <Plus size={16} /> Add your first entry
            </button>
          </div>
        )}
      </main>
    </div>
  );
}