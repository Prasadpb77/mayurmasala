import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import KpiCard from "@/components/KpiCard";
import { currentFinYear, inr } from "@/lib/finance";
import { PiggyBank, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { period: string; sale: number; purchase: number; expense: number };

function pivot(rows: any[], periodKey: string): Row[] {
  const map = new Map<string, Row>();
  rows.forEach((r) => {
    const key = String(r[periodKey]);
    if (!map.has(key)) map.set(key, { period: key, sale: 0, purchase: 0, expense: 0 });
    (map.get(key) as any)[r.type] = Number(r.total);
  });
  return Array.from(map.values()).sort((a, b) => (a.period < b.period ? 1 : -1));
}

function NetTable({ title, rows, formatPeriod }: { title: string; rows: Row[]; formatPeriod: (p: string) => string }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Period</th>
              <th>Sales</th>
              <th>Purchases</th>
              <th>Expenses</th>
              <th>Net (Sales − Purchase − Expense)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-masala-brown/50 py-6">No data yet.</td></tr>
            )}
            {rows.map((r) => {
              const net = r.sale - r.purchase - r.expense;
              return (
                <tr key={r.period}>
                  <td>{formatPeriod(r.period)}</td>
                  <td>{inr(r.sale)}</td>
                  <td>{inr(r.purchase)}</td>
                  <td>{inr(r.expense)}</td>
                  <td className={`font-semibold ${net >= 0 ? "text-masala-green" : "text-masala-red"}`}>
                    {net >= 0 ? "▲ " : "▼ "}{inr(net)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ProfitLossPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");

  const fy = currentFinYear();

  const [monthlyRes, yearlyRes, fyRes] = await Promise.all([
    supabase.from("v_monthly_summary").select("*").order("period", { ascending: false }).limit(48),
    supabase.from("v_yearly_summary").select("*").order("period", { ascending: false }),
    supabase.from("v_fy_summary").select("*"),
  ]);

  const monthlyRows = pivot(monthlyRes.data || [], "period");
  const yearlyRows = pivot(yearlyRes.data || [], "period");

  // FY view groups by fin_year text, not "period" — pivot manually.
  const fyMap = new Map<string, Row>();
  (fyRes.data || []).forEach((r: any) => {
    const key = r.fin_year;
    if (!fyMap.has(key)) fyMap.set(key, { period: key, sale: 0, purchase: 0, expense: 0 });
    (fyMap.get(key) as any)[r.type] = Number(r.total);
  });
  const fyRows = Array.from(fyMap.values()).sort((a, b) => (a.period < b.period ? 1 : -1));

  const currentFyRow = fyRows.find((r) => r.period === fy) || { sale: 0, purchase: 0, expense: 0 };
  const currentFyNet = currentFyRow.sale - currentFyRow.purchase - currentFyRow.expense;

  const now = new Date();
  const thisMonthKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const thisMonthRow = monthlyRows.find((r) => r.period === thisMonthKey) || { sale: 0, purchase: 0, expense: 0 };
  const thisMonthNet = thisMonthRow.sale - thisMonthRow.purchase - thisMonthRow.expense;

  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-6 pt-20 md:pt-6 pb-20 md:pb-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profit &amp; Loss</h1>
          <p className="text-masala-brown/60 text-sm">Net = Sales − Purchase − Expense</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="This month — Sales" value={thisMonthRow.sale} icon={TrendingUp} />
          <KpiCard label="This month — Purchase + Expense" value={thisMonthRow.purchase + thisMonthRow.expense} icon={Wallet} />
          <KpiCard label="This month — Net" value={thisMonthNet} icon={thisMonthNet >= 0 ? TrendingUp : TrendingDown} />
          <KpiCard label={`FY ${fy} — Net`} value={currentFyNet} icon={PiggyBank} />
        </div>

        <NetTable
          title="Monthly"
          rows={monthlyRows}
          formatPeriod={(p) => new Date(p).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        />
        <NetTable
          title="Yearly (calendar year)"
          rows={yearlyRows}
          formatPeriod={(p) => new Date(p).getFullYear().toString()}
        />
        <NetTable
          title="Financial Year (Apr – Mar)"
          rows={fyRows}
          formatPeriod={(p) => `FY ${p}`}
        />
      </main>
    </div>
  );
}
