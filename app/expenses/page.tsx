import Nav from "@/components/Nav";
import TxnPage from "@/components/TxnPage";

export default function ExpensesPage() {
  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-6">
        <TxnPage type="expense" title="Expenses" />
      </main>
    </div>
  );
}
