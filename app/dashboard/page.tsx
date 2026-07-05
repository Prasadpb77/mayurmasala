import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import TrendChart from "@/components/TrendChart";
import { currentFinYear } from "@/lib/finance";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import QuickAdd from "@/components/QuickAdd";

export const dynamic = "force-dynamic";

async function sumWhere(supabase: any, type: string, gteDate?: string) {
  let q = supabase.from("transactions").select("amount").eq("type", type);
  if (gteDate) q = q.gte("txn_date", gteDate);
  const { data } = await q;
  return (data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
}

export default async function DashboardPage() {
  const supabase = createClient();
  // getSession() reads the cookie locally — no network round trip, unlike getUser().
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const fy = currentFinYear();
  const [fyStartYear] = fy.split("-");
  const fyStart = `${fyStartYear}-04-01`;

  // Everything fires in ONE parallel batch instead of a Promise.all followed by
  // sequential awaits — this is what was adding extra round trips and made the
  // dashboard feel slow to open right after login.
  const [
    monthSale,
    monthPurchase,
    monthExpense,
    fySale,
    fyPurchase,
    fyExpense,
    recentRes,
    monthlyRes,
  ] = await Promise.all([
    sumWhere(supabase, "sale", monthStart),
    sumWhere(supabase, "purchase", monthStart),
    sumWhere(supabase, "expense", monthStart),
    sumWhere(supabase, "sale", fyStart),
    sumWhere(supabase, "purchase", fyStart),
    sumWhere(supabase, "expense", fyStart),
    supabase
      .from("transactions")
      .select("txn_date,type,amount,category,description,source")
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("v_monthly_summary")
      .select("*")
      .order("period", { ascending: true })
      .limit(36),
  ]);

  const recent = recentRes.data;
  const monthlyRaw = monthlyRes.data;

  const chartMap: Record<string, any> = {};
  (monthlyRaw || []).forEach((r: any) => {
    const key = new Date(r.period).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    chartMap[key] = chartMap[key] || { period: key, sale: 0, purchase: 0, expense: 0 };
    chartMap[key][r.type] = Number(r.total);
  });
  const chartData = Object.values(chartMap).slice(-12);

  // Net = Sales - Purchases - Expenses (matches the Profit & Loss page formula)
  const monthNet = monthSale - monthPurchase - monthExpense;
  const fyNet = fySale - fyPurchase - fyExpense;

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
          <KpiCard
            label={`FY ${fy} — Net (Sales − Purchase − Expense)`}
            value={fyNet}
            sub={`This month's net: ₹${monthNet.toLocaleString("en-IN")}`}
            icon={PiggyBank}
          />
        </div>

        <TrendChart data={chartData as any} />

        <DataTable rows={(recent || []) as any} title="Recent transactions" />
        <QuickAdd />
      </main>
    </div>
  );
}
