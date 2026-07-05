export default function Loading() {
  return (
    <div className="flex">
      <div className="hidden md:block w-60 shrink-0 min-h-screen bg-masala-gradient" />
      <main className="flex-1 p-6 pt-20 md:pt-6 pb-20 md:pb-6 space-y-6 animate-pulse">
        <div className="h-7 w-40 bg-masala-brown/10 rounded" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-72 rounded-xl2 bg-masala-brown/10 md:col-span-1" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-24 rounded-xl2 bg-masala-brown/10" />
            <div className="h-64 rounded-xl2 bg-masala-brown/10" />
          </div>
        </div>
      </main>
    </div>
  );
}
