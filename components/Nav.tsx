"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, ShoppingCart, PackagePlus, Receipt, LogOut, Menu, X, CalendarCheck, LineChart } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/purchases", label: "Purchases", icon: PackagePlus },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/profit-loss", label: "P&L", icon: LineChart },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-full bg-masala-gradient text-masala-cream shadow-lg flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar — always side, slides in on mobile */}
      <div
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-50 w-60 bg-masala-gradient text-masala-cream flex flex-col transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-masala-gold text-masala-brown font-bold flex items-center justify-center">
            MM
          </div>
          <div className="flex-1">
            <p className="font-bold leading-tight">Mayur Masala</p>
            <p className="text-xs text-masala-cream/70">Center</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden p-1">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-masala-gold text-masala-brown"
                  : "hover:bg-white/10 text-masala-cream/90"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => { logout(); setOpen(false); }}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  );
}