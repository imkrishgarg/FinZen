"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

type SimResult = {
  verdict: string; risk: string; bestCase: number;
  worstCase: number; expectedCase: number; suggestion: string;
};

export default function InvestPage() {
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(5);
  const [riskLevel, setRiskLevel] = useState<"low"|"medium"|"high">("medium");
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  const rates = { low: { best: 0.08, expected: 0.06, worst: 0.03 }, medium: { best: 0.15, expected: 0.12, worst: -0.05 }, high: { best: 0.30, expected: 0.18, worst: -0.20 } };
  const r = rates[riskLevel];

  const chartData = Array.from({ length: years + 1 }, (_, i) => ({
    year: `Y${i}`,
    best: Math.round(amount * Math.pow(1 + r.best, i)),
    expected: Math.round(amount * Math.pow(1 + r.expected, i)),
    worst: Math.round(amount * Math.pow(1 + r.worst, i)),
  }));

  const simulate = async () => {
    setLoading(true);
    const best = Math.round(amount * Math.pow(1 + r.best, years));
    const expected = Math.round(amount * Math.pow(1 + r.expected, years));
    const worst = Math.round(amount * Math.pow(1 + r.worst, years));
    try {
      const res = await fetch("/api/invest-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, years, riskLevel, best, expected, worst })
      });
      const data = await res.json();
      setResult({ ...data, bestCase: best, expectedCase: expected, worstCase: worst });
    } catch { console.error("Simulation failed"); }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-400" /> Investment Risk Sandbox
        </h1>
        <p className="text-slate-400 mt-1">Simulate investments before risking real money</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardContent className="pt-6 space-y-5">
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Investment Amount</span><span className="text-white font-bold">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <input type="range" min="1000" max="1000000" step="1000" value={amount}
              onChange={e => setAmount(Number(e.target.value))} className="w-full accent-yellow-500" />
          </div>
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Time Period</span><span className="text-white font-bold">{years} years</span>
            </div>
            <input type="range" min="1" max="30" value={years}
              onChange={e => setYears(Number(e.target.value))} className="w-full accent-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Risk Level</p>
            <div className="flex gap-3">
              {(["low","medium","high"] as const).map(r => (
                <button key={r} onClick={() => setRiskLevel(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${riskLevel === r ? r === "low" ? "bg-green-600 border-green-500 text-white" : r === "medium" ? "bg-yellow-600 border-yellow-500 text-white" : "bg-red-600 border-red-500 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader><CardTitle className="text-white text-sm">Projected Returns Chart</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={55} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
              <Line type="monotone" dataKey="best" stroke="#22c55e" strokeWidth={2} dot={false} name="Best Case" />
              <Line type="monotone" dataKey="expected" stroke="#a855f7" strokeWidth={2} dot={false} name="Expected" />
              <Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={2} dot={false} name="Worst Case" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Best Case", val: chartData[chartData.length-1]?.best, color: "text-green-400" },
          { label: "Expected", val: chartData[chartData.length-1]?.expected, color: "text-purple-400" },
          { label: "Worst Case", val: chartData[chartData.length-1]?.worst, color: "text-red-400" },
        ].map(c => (
          <Card key={c.label} className="bg-slate-900 border-slate-800 text-center">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>₹{c.val?.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={simulate} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700 py-6 text-base font-semibold mb-4">
        {loading ? "Analyzing..." : "Get AI Investment Advice"}
      </Button>

      {result && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge className="bg-yellow-500/20 text-yellow-400 text-sm px-3 py-1">{result.risk} Risk</Badge>
              <span className="text-white font-bold">{result.verdict}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{result.suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}