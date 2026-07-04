"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, ShoppingCart, PackagePlus, Receipt, LogOut, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/purchases", label: "Purchases", icon: PackagePlus },
  { href: "/expenses", label: "Expenses", icon: Receipt },
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
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-masala-gradient text-masala-cream flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-masala-gold text-masala-brown font-bold flex items-center justify-center text-sm">
            MM
          </div>
          <p className="font-bold text-sm leading-tight">Mayur Masala Center</p>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute top-14 left-0 right-0 bg-masala-gradient rounded-b-2xl p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
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
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10 text-masala-cream/90"
              >
                <LogOut size={16} /> Sign out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-masala-gradient border-t border-white/10 shadow-2xl">
        <div className="flex items-center justify-around py-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium rounded-lg transition-colors min-w-0",
                pathname === href
                  ? "text-masala-gold"
                  : "text-masala-cream/70"
              )}
            >
              <Icon size={20} />
              <span className="truncate max-w-[60px]">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 shrink-0 min-h-screen bg-masala-gradient text-masala-cream flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-masala-gold text-masala-brown font-bold flex items-center justify-center">
            MM
          </div>
          <div>
            <p className="font-bold leading-tight">Mayur Masala</p>
            <p className="text-xs text-masala-cream/70">Center</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
          onClick={logout}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  );
}