import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import TrendChart from "@/components/TrendChart";
import { currentFinYear } from "@/lib/finance";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

export const dynamic = "force-dynamic";

async function sumWhere(supabase: any, type: string, gteDate?: string) {
  let q = supabase.from("transactions").select("amount").eq("type", type);
  if (gteDate) q = q.gte("txn_date", gteDate);
  const { data } = await q;
  return (data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const fy = currentFinYear();
  const [fyStartYear] = fy.split("-");
  const fyStart = `${fyStartYear}-04-01`;

  const [monthSale, monthPurchase, monthExpense, fySale, fyExpense] = await Promise.all([
    sumWhere(supabase, "sale", monthStart),
    sumWhere(supabase, "purchase", monthStart),
    sumWhere(supabase, "expense", monthStart),
    sumWhere(supabase, "sale", fyStart),
    sumWhere(supabase, "expense", fyStart),
  ]);

  const { data: recent } = await supabase
    .from("transactions")
    .select("txn_date,type,amount,category,description,source")
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(15);

  const { data: monthlyRaw } = await supabase
    .from("v_monthly_summary")
    .select("*")
    .order("period", { ascending: true })
    .limit(36);

  const chartMap: Record<string, any> = {};
  (monthlyRaw || []).forEach((r: any) => {
    const key = new Date(r.period).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    chartMap[key] = chartMap[key] || { period: key, sale: 0, purchase: 0, expense: 0 };
    chartMap[key][r.type] = Number(r.total);
  });
  const chartData = Object.values(chartMap).slice(-12);

  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-6 pt-20 md:pt-6 pb-20 md:pb-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-masala-brown/60 text-sm">Financial year {fy}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="This month — Sales" value={monthSale} icon={TrendingUp} />
          <KpiCard label="This month — Purchases" value={monthPurchase} icon={TrendingDown} />
          <KpiCard label="This month — Expenses" value={monthExpense} icon={Wallet} />
          <KpiCard label={`FY ${fy} — Net (Sales - Expenses)`} value={fySale - fyExpense} icon={PiggyBank} />
        </div>

        <TrendChart data={chartData as any} />

        <DataTable rows={(recent || []) as any} title="Recent transactions" />
      </main>
    </div>
  );
}
