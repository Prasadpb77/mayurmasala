import Nav from "@/components/Nav";
import TxnPage from "@/components/TxnPage";
import QuickAdd from "@/components/QuickAdd";

export default function ExpensesPage() {
  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-4 md:p-6">
        <TxnPage type="expense" title="Expenses" />
        <QuickAdd />
      </main>
    </div>
  );
}
