export default function Loading() {
  return (
    <div className="flex">
      <div className="hidden md:block w-60 shrink-0 min-h-screen bg-masala-gradient" />
      <main className="flex-1 p-6 pt-20 md:pt-6 pb-20 md:pb-6 space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-masala-brown/10 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl2 bg-masala-brown/10" />
          ))}
        </div>
        <div className="h-64 rounded-xl2 bg-masala-brown/10" />
        <div className="h-64 rounded-xl2 bg-masala-brown/10" />
      </main>
    </div>
  );
}
