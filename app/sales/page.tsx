import Nav from "@/components/Nav";
import TxnPage from "@/components/TxnPage";

export default function SalesPage() {
  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 p-6">
        <TxnPage type="sale" title="Sales" />
      </main>
    </div>
  );
}
