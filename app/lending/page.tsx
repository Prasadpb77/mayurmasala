"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import { inr } from "@/lib/finance";
import { Plus, X, HandCoins, ArrowLeftRight, Clock, MessageCircle, Check, Send, Edit2, Trash2, Eye } from "lucide-react";
import NameDropdown from "@/components/NameDropdown";

type LendingRow = {
  id: string;
  person_name: string;
  whatsapp_number: string | null;
  amount: number;
  paid_amount: number;
  type: "lend" | "settle";
  date: string;
  created_at: string;
};

type PersonSummary = {
  name: string;
  whatsapp_number: string | null;
  totalLent: number;
  totalSettled: number;
  remaining: number;
  firstDate: string;
  daysSince: number;
};

export default function LendingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [rows, setRows] = useState<LendingRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPerson, setViewingPerson] = useState<string | null>(null);
  const [form, setForm] = useState({
    person_name: "",
    whatsapp_number: "",
    amount: "",
    type: "lend" as "lend" | "settle",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastEntry, setLastEntry] = useState<LendingRow | null>(null);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

  // Auto-fill person details when name changes
  useEffect(() => {
    if (form.person_name && rows.length > 0) {
      const existingPerson = rows.find(r => r.person_name === form.person_name);
      if (existingPerson) {
        setForm(prev => ({
          ...prev,
          whatsapp_number: existingPerson.whatsapp_number || prev.whatsapp_number,
        }));
      }
    }
  }, [form.person_name, rows]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return router.replace("/login");
      load();
    });
  }, []);

  async function load() {
    const { data } = await supabase.from("lending").select("*").order("date", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.person_name || !form.amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const totalAmt = Number(form.amount);

    if (editingId) {
      const { error } = await supabase
        .from("lending")
        .update({
          person_name: form.person_name.trim(),
          whatsapp_number: form.whatsapp_number.trim() || null,
          amount: totalAmt,
          type: form.type,
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
        .from("lending")
        .insert({
          person_name: form.person_name.trim(),
          whatsapp_number: form.whatsapp_number.trim() || null,
          amount: totalAmt,
          type: form.type,
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
        if (insertedData[0].whatsapp_number) {
          setShowWhatsAppPrompt(true);
        }
      }
    }

    setForm({
      person_name: "",
      whatsapp_number: "",
      amount: "",
      type: "lend",
      date: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    await load();
  }

  function startEdit(row: LendingRow) {
    setEditingId(row.id);
    setForm({
      person_name: row.person_name,
      whatsapp_number: row.whatsapp_number || "",
      amount: String(row.amount),
      type: row.type,
      date: row.date,
    });
    setShowAdd(true);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const { error } = await supabase.from("lending").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    await load();
  }

  function sendWhatsApp(entry: LendingRow) {
    if (!entry.whatsapp_number) return;
    const phone = entry.whatsapp_number.replace(/\D/g, "");
    const remaining = entry.amount - entry.paid_amount;
    const message = `नमस्कार ${entry.person_name}, या ${new Date(entry.date).toLocaleDateString("en-IN")} रोजी तुमच्याकडून ₹${entry.amount.toLocaleString("en-IN")} ${entry.type === 'lend' ? 'उधारी घेतली' : 'परत केली'}. बाकी रक्कम ₹${remaining.toLocaleString("en-IN")} आहे. कृपया लवकरच पayment पाठवण्यासाठी संपर्क करा.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function sendFollowUpWhatsApp(entry: LendingRow) {
    if (!entry.whatsapp_number) return;
    const phone = entry.whatsapp_number.replace(/\D/g, "");
    const remaining = entry.amount - entry.paid_amount;
    const message = `नमस्कार ${entry.person_name}, ही एक फॉलो-अप संदेश आहे. तुमच्याकडून ₹${remaining.toLocaleString("en-IN")} बाकी आहे. कृपया लवकरच पayment पाठवण्यासाठी संपर्क करा.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  // Compute per-person summary
  const personMap = new Map<string, { whatsapp_number: string | null; totalLent: number; totalSettled: number; firstDate: string }>();
  rows.forEach((r) => {
    const p = personMap.get(r.person_name) || { whatsapp_number: r.whatsapp_number, totalLent: 0, totalSettled: 0, firstDate: r.date };
    if (r.type === "lend") p.totalLent += r.amount;
    else p.totalSettled += r.amount;
    if (r.date < p.firstDate) p.firstDate = r.date;
    personMap.set(r.person_name, p);
  });

  const summaries: PersonSummary[] = Array.from(personMap.entries()).map(([name, data]) => {
    const first = new Date(data.firstDate);
    const now = new Date();
    const diffMs = now.getTime() - first.getTime();
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      name,
      whatsapp_number: data.whatsapp_number,
      totalLent: data.totalLent,
      totalSettled: data.totalSettled,
      remaining: data.totalLent - data.totalSettled,
      firstDate: data.firstDate,
      daysSince,
    };
  }).sort((a, b) => b.remaining - a.remaining);

  const uniqueNames = Array.from(new Set(rows.map((r) => r.person_name))).sort();
  const filteredRows = viewingPerson ? rows.filter((r) => r.person_name === viewingPerson) : rows;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-masala-brown/50">Loading...</p></div>;

  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Lending</h1>
            <p className="text-masala-brown/60 text-sm">Track money lent and settled</p>
          </div>
          <button onClick={() => { setShowAdd(true); setEditingId(null); }} className="btn-primary flex items-center gap-1">
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {/* Person-wise widgets */}
        {summaries.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summaries.map((s) => (
              <div key={s.name} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-masala-gradient flex items-center justify-center text-masala-gold font-bold text-sm">
                      {s.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      {s.whatsapp_number && (
                        <p className="text-xs text-masala-brown/50">{s.whatsapp_number}</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${s.remaining > 0 ? "text-masala-red" : "text-green-600"}`}>
                    {s.remaining > 0 ? `₹${s.remaining.toLocaleString("en-IN")}` : "Settled ✓"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-masala-brown/70">
                  <div>
                    <span className="block text-masala-brown/50">Lent</span>
                    <span className="font-medium text-masala-brown">{inr(s.totalLent)}</span>
                  </div>
                  <div>
                    <span className="block text-masala-brown/50">Got back</span>
                    <span className="font-medium text-green-700">{inr(s.totalSettled)}</span>
                  </div>
                  <div>
                    <span className="block text-masala-brown/50">Remaining</span>
                    <span className={`font-medium ${s.remaining > 0 ? "text-masala-red" : "text-green-600"}`}>{inr(s.remaining)}</span>
                  </div>
                  <div>
                    <span className="block text-masala-brown/50 flex items-center gap-1"><Clock size={10} /> Days</span>
                    <span className="font-medium">{s.daysSince} days</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setViewingPerson(viewingPerson === s.name ? null : s.name)}
                    className="flex-1 text-xs py-2 rounded-lg border border-masala-brown/20 hover:bg-masala-brown/5 flex items-center justify-center gap-1"
                  >
                    <Eye size={14} /> {viewingPerson === s.name ? "Show All" : "View History"}
                  </button>
                  {s.remaining > 0 && s.whatsapp_number && (
                    <button
                      onClick={() => sendFollowUpWhatsApp(rows.find((r) => r.person_name === s.name)!)}
                      className="px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                      title="Send reminder"
                    >
                      <Send size={14} />
                    </button>
                  )}
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
                <h3 className="font-bold text-lg">{editingId ? "Edit Entry" : "Lending Entry"}</h3>
                <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="p-1 hover:text-masala-red"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-2">
                  {(["lend", "settle"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.type === t
                          ? t === "lend"
                            ? "border-masala-red bg-masala-red/5 text-masala-red"
                            : "border-green-600 bg-green-50 text-green-700"
                          : "border-masala-brown/10 text-masala-brown/60 hover:border-masala-brown/30"
                      }`}
                    >
                      {t === "lend" ? <HandCoins size={18} /> : <ArrowLeftRight size={18} />}
                      {t === "lend" ? "Lend" : "Settle"}
                    </button>
                  ))}
                </div>

                {/* Person name */}
                <div>
                  <label className="text-sm font-medium">Person Name</label>
                  <div className="mt-1">
                    <NameDropdown
                      names={uniqueNames}
                      value={form.person_name}
                      onChange={(value) => setForm({ ...form, person_name: value })}
                      placeholder="Enter or select name"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp number */}
                <div>
                  <label className="text-sm font-medium">WhatsApp Number (optional)</label>
                  <input className="input mt-1" type="tel" placeholder="e.g. 9876543210"
                    value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <input className="input mt-1" type="number" required min="0" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>

                {form.person_name && (() => {
                  const personRows = rows.filter(r => r.person_name === form.person_name);
                  const totalLent = personRows.filter(r => r.type === "lend").reduce((sum, r) => sum + r.amount, 0);
                  const totalSettled = personRows.filter(r => r.type === "settle").reduce((sum, r) => sum + r.amount, 0);
                  const remaining = totalLent - totalSettled;
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
                  {lastEntry.type === "lend" ? "Lent" : "Settled"} ₹{lastEntry.amount.toLocaleString("en-IN")} to {lastEntry.person_name}
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
        {filteredRows.length > 0 && (
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                {viewingPerson ? `${viewingPerson} - Transaction History` : "All Transactions"}
              </h3>
              {viewingPerson && (
                <button onClick={() => setViewingPerson(null)} className="text-sm text-masala-brown/60 hover:text-masala-brown">
                  Show All
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="px-3">Date</th>
                    <th className="px-3">Person</th>
                    <th className="px-3">Type</th>
                    <th className="px-3 text-right">Amount</th>
                    <th className="px-3 text-right">Paid</th>
                    <th className="px-3 text-right">Balance</th>
                    <th className="px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => {
                    const balance = r.amount - r.paid_amount;
                    return (
                      <tr key={r.id}>
                        <td className="px-3 whitespace-nowrap text-sm">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-3 text-sm font-medium">{r.person_name}</td>
                        <td className="px-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.type === "lend" ? "bg-masala-red/10 text-masala-red" : "bg-green-50 text-green-700"
                          }`}>
                            {r.type === "lend" ? "Lent" : "Settled"}
                          </span>
                        </td>
                        <td className="px-3 text-right whitespace-nowrap text-sm">{inr(r.amount)}</td>
                        <td className="px-3 text-right whitespace-nowrap text-sm text-green-700">{inr(r.paid_amount)}</td>
                        <td className="px-3 text-right whitespace-nowrap text-sm font-medium text-masala-red">{inr(balance)}</td>
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
                            {r.whatsapp_number && (
                              <button
                                onClick={() => sendFollowUpWhatsApp(r)}
                                className="p-1.5 rounded-md hover:bg-green-50 text-masala-brown/60 hover:text-green-700"
                                title="Send reminder"
                              >
                                <Send size={14} />
                              </button>
                            )}
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

        {summaries.length === 0 && (
          <div className="text-center py-12 text-masala-brown/50">
            <HandCoins size={40} className="mx-auto mb-3 opacity-50" />
            <p>No lending entries yet.</p>
            <button onClick={() => { setShowAdd(true); setEditingId(null); }} className="btn-primary mt-4 inline-flex items-center gap-1">
              <Plus size={16} /> Add your first lending entry
            </button>
          </div>
        )}
      </main>
    </div>
  );
}