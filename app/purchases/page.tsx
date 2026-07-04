import Nav from "@/components/Nav";
import TxnPage from "@/components/TxnPage";

export default function PurchasesPage() {
  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-6">
        <TxnPage type="purchase" title="Purchases" />
      </main>
    </div>
  );
}
