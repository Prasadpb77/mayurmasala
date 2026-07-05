"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import { inr } from "@/lib/finance";
import { Plus, X, HandCoins, ArrowLeftRight, Clock, MessageCircle, Check } from "lucide-react";

type LendingRow = {
  id: string;
  person_name: string;
  whatsapp_number: string | null;
  amount: number;
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
  const [form, setForm] = useState({ person_name: "", whatsapp_number: "", amount: "", type: "lend" as "lend" | "settle", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastEntry, setLastEntry] = useState<{ person_name: string; whatsapp_number: string | null; amount: number; type: string; remaining: number } | null>(null);

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

    // Calculate remaining before insert
    const personEntries = rows.filter(r => r.person_name === form.person_name);
    const currentRemaining = personEntries.reduce((sum, r) => {
      return sum + (r.type === "lend" ? r.amount : -r.amount);
    }, 0);
    const newRemaining = currentRemaining + (form.type === "lend" ? Number(form.amount) : -Number(form.amount));

    await supabase.from("lending").insert({
      person_name: form.person_name.trim(),
      whatsapp_number: form.whatsapp_number.trim() || null,
      amount: Number(form.amount),
      type: form.type,
      date: form.date,
      created_by: user?.id,
    });

    setLastEntry({
      person_name: form.person_name.trim(),
      whatsapp_number: form.whatsapp_number.trim() || null,
      amount: Number(form.amount),
      type: form.type,
      remaining: newRemaining,
    });

    setForm({ person_name: "", whatsapp_number: "", amount: "", type: "lend", date: new Date().toISOString().slice(0, 10) });
    setSaving(false);
    load();
  }

  // Auto-populate WhatsApp number when person name changes
  function handlePersonNameChange(name: string) {
    setForm({ ...form, person_name: name });
    const existing = rows.find(r => r.person_name === name && r.whatsapp_number);
    if (existing) {
      setForm(prev => ({ ...prev, person_name: name, whatsapp_number: existing.whatsapp_number || "" }));
    } else {
      setForm(prev => ({ ...prev, person_name: name, whatsapp_number: prev.whatsapp_number }));
    }
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

  function sendWhatsApp(entry: { person_name: string; whatsapp_number: string | null; amount: number; type: string; remaining: number }) {
    if (!entry.whatsapp_number) return;
    const phone = entry.whatsapp_number.replace(/\D/g, "");
    const actionText = entry.type === "lend" ? "Lent" : "Settled";
    const message = `Hi ${entry.person_name}, this is regarding your ${actionText.toLowerCase()} of ₹${entry.amount.toLocaleString("en-IN")} dated ${new Date().toLocaleDateString("en-IN")}. Your remaining balance is ₹${entry.remaining.toLocaleString("en-IN")}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

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
                <h3 className="font-bold text-lg">Lending Entry</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 hover:text-masala-red"><X size={20} /></button>
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
                  <div className="relative mt-1">
                    <input
                      className="input"
                      list="person-list"
                      value={form.person_name}
                      onChange={(e) => handlePersonNameChange(e.target.value)}
                      required
                      placeholder="Enter or select name"
                    />
                    <datalist id="person-list">
                      {uniqueNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
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
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input className="input mt-1" type="date" required
                    value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <button className="btn-primary w-full py-3" disabled={saving}>
                  {saving ? "Saving..." : form.type === "lend" ? "Add Lend" : "Add Settle"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* WhatsApp notification after adding entry */}
        {lastEntry && lastEntry.whatsapp_number && (
          <div className="card p-4 border-2 border-green-200 bg-green-50/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check size={20} className="text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Entry added successfully!</h3>
                <p className="text-sm text-green-700 mb-3">
                  {lastEntry.type === "lend" ? "Lent" : "Settled"} ₹{lastEntry.amount.toLocaleString("en-IN")} to {lastEntry.person_name}
                  {lastEntry.remaining !== 0 && ` • Remaining: ₹${lastEntry.remaining.toLocaleString("en-IN")}`}
                </p>
                <button
                  onClick={() => sendWhatsApp(lastEntry)}
                  className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <MessageCircle size={18} /> Send WhatsApp Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
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
              </div>
            ))}
          </div>
        )}

        {summaries.length === 0 && (
          <div className="text-center py-12 text-masala-brown/50">
            <HandCoins size={40} className="mx-auto mb-3 opacity-50" />
            <p>No lending entries yet.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 inline-flex items-center gap-1">
              <Plus size={16} /> Add your first lending entry
            </button>
          </div>
        )}

        {/* All transactions table */}
        {rows.length > 0 && (
          <div className="card p-4 md:p-5">
            <h3 className="font-semibold mb-3">All transactions</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="px-3">Date</th>
                    <th className="px-3">Person</th>
                    <th className="px-3">Type</th>
                    <th className="px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
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
                      <td className="px-3 text-right whitespace-nowrap text-sm font-medium">{inr(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}