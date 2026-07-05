"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import { inr } from "@/lib/finance";
import { Plus, X, MessageCircle, Check, Send } from "lucide-react";

type VendorRow = {
  id: string;
  vendor_name: string;
  whatsapp_number: string | null;
  description: string | null;
  amount: number;
  status: "paid" | "unpaid";
  date: string;
  created_at: string;
};

export default function SaleVendorsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [rows, setRows] = useState<VendorRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    vendor_name: "",
    whatsapp_number: "",
    description: "",
    amount: "",
    status: "unpaid" as "paid" | "unpaid",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastEntry, setLastEntry] = useState<VendorRow | null>(null);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return router.replace("/login");
      load();
    });
  }, []);

  async function load() {
    const { data } = await supabase
      .from("sale_vendors")
      .select("*")
      .order("date", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor_name || !form.amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: insertedData, error: insertError } = await supabase
      .from("sale_vendors")
      .insert({
        vendor_name: form.vendor_name.trim(),
        whatsapp_number: form.whatsapp_number.trim() || null,
        description: form.description.trim() || null,
        amount: Number(form.amount),
        status: form.status,
        date: form.date,
        created_by: user?.id,
      })
      .select();

    if (insertError) {
      console.error("Failed to insert sale vendor entry:", insertError);
      alert(`Failed to save entry: ${insertError.message}`);
      setSaving(false);
      return;
    }

    if (!insertedData || insertedData.length === 0) {
      console.error("No data returned from insert");
      alert("Failed to save entry: no data returned");
      setSaving(false);
      return;
    }

    const savedEntry = insertedData[0];
    setLastEntry(savedEntry);
    setShowWhatsAppPrompt(true);
    setForm({
      vendor_name: "",
      whatsapp_number: "",
      description: "",
      amount: "",
      status: "unpaid",
      date: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    await load();
  }

  function sendWhatsApp(entry: VendorRow) {
    if (!entry.whatsapp_number) return;
    const phone = entry.whatsapp_number.replace(/\D/g, "");
    const message = `Hi ${entry.vendor_name}, this is a reminder regarding your payment of ₹${entry.amount.toLocaleString("en-IN")} dated ${new Date(entry.date).toLocaleDateString("en-IN")}. Your payment is currently marked as ${entry.status}. Please arrange for payment at the earliest.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function sendFollowUpWhatsApp(entry: VendorRow) {
    if (!entry.whatsapp_number) return;
    const phone = entry.whatsapp_number.replace(/\D/g, "");
    const message = `Hi ${entry.vendor_name}, just following up on the payment of ₹${entry.amount.toLocaleString("en-IN")} that was due. Please let us know when we can expect the payment.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  const uniqueVendors = Array.from(new Set(rows.map((r) => r.vendor_name))).sort();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-masala-brown/50">Loading...</p></div>;

  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sale Vendors</h1>
            <p className="text-masala-brown/60 text-sm">Track sales to vendors</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1">
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {/* Add entry modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setShowAdd(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-masala-cream w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Add Sale Vendor Entry</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 hover:text-masala-red"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Vendor Name</label>
                  <div className="relative mt-1">
                    <input
                      className="input"
                      list="vendor-list"
                      value={form.vendor_name}
                      onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                      required
                      placeholder="Enter or select vendor"
                    />
                    <datalist id="vendor-list">
                      {uniqueVendors.map((v) => <option key={v} value={v} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">WhatsApp Number (optional)</label>
                  <input className="input mt-1" type="tel" placeholder="e.g. 9876543210"
                    value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <textarea className="input mt-1" rows={2} placeholder="What was sold..."
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <input className="input mt-1" type="number" required min="0" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(["paid", "unpaid"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, status: s })}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.status === s
                            ? s === "paid"
                              ? "border-green-600 bg-green-50 text-green-700"
                              : "border-masala-red bg-masala-red/5 text-masala-red"
                            : "border-masala-brown/10 text-masala-brown/60"
                        }`}
                      >
                        {s === "paid" ? "✓ Paid" : "⏳ Unpaid"}
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
                  {saving ? "Saving..." : "Add Entry"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* WhatsApp notification after adding entry */}
        {showWhatsAppPrompt && lastEntry && lastEntry.whatsapp_number && (
          <div className="card p-4 border-2 border-green-200 bg-green-50/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check size={20} className="text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Entry added successfully!</h3>
                <p className="text-sm text-green-700 mb-3">
                  Sale to {lastEntry.vendor_name} for ₹{lastEntry.amount.toLocaleString("en-IN")}
                  {lastEntry.status === "unpaid" && " • Status: Unpaid"}
                </p>
                <button
                  onClick={() => { sendWhatsApp(lastEntry); setShowWhatsAppPrompt(false); }}
                  className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <MessageCircle size={18} /> Send WhatsApp Notification
                </button>
                <button
                  onClick={() => setShowWhatsAppPrompt(false)}
                  className="ml-2 px-4 py-2 text-sm text-masala-brown/60 hover:text-masala-brown"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All transactions table */}
        {rows.length > 0 && (
          <div className="card p-4 md:p-5">
            <h3 className="font-semibold mb-3">All Sale Entries</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="px-3">Date</th>
                    <th className="px-3">Vendor</th>
                    <th className="px-3">Description</th>
                    <th className="px-3 text-right">Amount</th>
                    <th className="px-3 text-center">Status</th>
                    <th className="px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 whitespace-nowrap text-sm">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 text-sm font-medium">{r.vendor_name}</td>
                      <td className="px-3 text-sm max-w-[150px] truncate">{r.description || "—"}</td>
                      <td className="px-3 text-right whitespace-nowrap text-sm font-medium">{inr(r.amount)}</td>
                      <td className="px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "paid" ? "bg-green-50 text-green-700" : "bg-masala-red/10 text-masala-red"
                        }`}>
                          {r.status === "paid" ? "✓ Paid" : "⏳ Unpaid"}
                        </span>
                      </td>
                      <td className="px-3 text-center whitespace-nowrap">
                        {r.whatsapp_number && (
                          <button
                            onClick={() => sendFollowUpWhatsApp(r)}
                            className="p-1.5 rounded-md hover:bg-green-50 text-masala-brown/60 hover:text-green-700 transition-colors"
                            title="Send follow-up WhatsApp"
                          >
                            <Send size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length === 0 && (
          <div className="text-center py-12 text-masala-brown/50">
            <p>No sale vendor entries yet.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 inline-flex items-center gap-1">
              <Plus size={16} /> Add your first entry
            </button>
          </div>
        )}
      </main>
    </div>
  );
}