"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, ShoppingCart, PackagePlus, Receipt } from "lucide-react";

const types = [
  { key: "sale", label: "Sale", icon: ShoppingCart, color: "text-green-600 bg-green-50 border-green-200" },
  { key: "purchase", label: "Purchase", icon: PackagePlus, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "expense", label: "Expense", icon: Receipt, color: "text-red-600 bg-red-50 border-red-200" },
] as const;

export default function QuickAdd({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"sale" | "purchase" | "expense">("sale");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({
      type,
      amount: Number(amount),
      category: category || null,
      txn_date: new Date().toISOString().slice(0, 10),
      source: "web",
      created_by: user?.id,
    });
    setAmount("");
    setCategory("");
    setSaving(false);
    setOpen(false);
    onDone?.();
  }

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-masala-red text-white shadow-xl hover:bg-masala-redDeep transition-colors flex items-center justify-center"
        title="Quick add"
      >
        <Plus size={28} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-masala-cream w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Quick Add</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:text-masala-red">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {types.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      type === t.key
                        ? "border-masala-red bg-masala-red/5 text-masala-red"
                        : "border-masala-brown/10 text-masala-brown/60 hover:border-masala-brown/30"
                    }`}
                  >
                    <t.icon size={20} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <input
                  className="input mt-1"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <input
                  className="input mt-1"
                  placeholder="e.g. Garam Masala, Rent..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full py-3" disabled={saving}>
                {saving ? "Adding..." : `Add ${type}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}