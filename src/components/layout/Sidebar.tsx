"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Shield, FileText, MessageCircle,
  MapPin, BarChart2, LogOut, Zap
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: BarChart2, label: "Dashboard" },
  { href: "/dashboard/market", icon: TrendingUp, label: "Market Intel" },
  { href: "/dashboard/upi-shield", icon: Shield, label: "UPI Shield" },
  { href: "/dashboard/insurance", icon: FileText, label: "Policy Decoder" },
  { href: "/dashboard/invest", icon: Zap, label: "Risk Sandbox" },
  { href: "/dashboard/nearby", icon: MapPin, label: "FinZen Nearby" },
  { href: "/dashboard/copilot", icon: MessageCircle, label: "AI Co-pilot" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">FinZen</h1>
        <p className="text-xs text-slate-500 mt-1">Financial Intelligence</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all w-full">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}