"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, FileText, MessageCircle, MapPin, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  { href: "/dashboard/market", icon: TrendingUp, title: "Market Intel", desc: "Live crypto & stocks with AI analysis", color: "text-green-400", bg: "bg-green-400/10" },
  { href: "/dashboard/upi-shield", icon: Shield, title: "UPI Shield", desc: "Scan QR codes & detect fraud instantly", color: "text-red-400", bg: "bg-red-400/10" },
  { href: "/dashboard/insurance", icon: FileText, title: "Policy Decoder", desc: "Upload insurance PDF, AI explains it", color: "text-blue-400", bg: "bg-blue-400/10" },
  { href: "/dashboard/invest", icon: Zap, title: "Risk Sandbox", desc: "Simulate investments before risking money", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { href: "/dashboard/nearby", icon: MapPin, title: "FinZen Nearby", desc: "Find ATMs, banks & fraud hotspots near you", color: "text-purple-400", bg: "bg-purple-400/10" },
  { href: "/dashboard/copilot", icon: MessageCircle, title: "AI Co-pilot", desc: "Voice & chat financial assistant", color: "text-pink-400", bg: "bg-pink-400/10" },
];

export default function DashboardPage() {
  const [userName, setUserName] = useState("there");

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) setUserName(user.displayName.split(" ")[0]);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Hey {userName} 👋</h1>
        <p className="text-slate-400 mt-1">Your financial intelligence dashboard. What do you want to explore today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.href} href={f.href}>
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <CardTitle className="text-white text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}