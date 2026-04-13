"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Search } from "lucide-react";

type CoinData = {
  name: string; symbol: string; image: string;
  current_price: number; price_change_percentage_24h: number;
  high_24h: number; low_24h: number; market_cap: number;
  ath: number; ath_change_percentage: number; total_volume: number;
  circulating_supply: number;
  price_change_percentage_7d_in_currency?: number;
};
type ChartPoint = { date: string; price: number };
type Analysis = {
  verdict: "BUY" | "HOLD" | "AVOID";
  verdictReason: string;
  scores: { momentum: number; risk: number; liquidity: number; potential: number };
  entryPrice: number; targetPrice: number; stopLoss: number;
  portfolioPercent: number; taxOnGain: number;
  oneLineSummary: string;
  redFlags: string[]; greenFlags: string[];
};

const POPULAR = ["bitcoin","ethereum","solana","dogecoin","ripple","cardano","polkadot","chainlink","avalanche-2","matic-network"];

function calcVolatility(prices: number[]) {
  const returns = prices.slice(1).map((p,i) => (p - prices[i]) / prices[i]);
  const mean = returns.reduce((a,b) => a+b,0) / returns.length;
  const variance = returns.reduce((a,b) => a + Math.pow(b-mean,2),0) / returns.length;
  return (Math.sqrt(variance) * 100).toFixed(2);
}
function calcSupport(prices: number[]) { return Math.min(...prices.slice(-10)); }
function calcResistance(prices: number[]) { return Math.max(...prices.slice(-10)); }
function calcTrend(prices: number[]) {
  const first = prices.slice(0,5).reduce((a,b)=>a+b)/5;
  const last = prices.slice(-5).reduce((a,b)=>a+b)/5;
  const change = ((last-first)/first)*100;
  if (change > 3) return "BULLISH"; if (change < -3) return "BEARISH"; return "SIDEWAYS";
}

export default function MarketPage() {
  const [query, setQuery] = useState("");
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [rawPrices, setRawPrices] = useState<number[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [invest, setInvest] = useState(10000);

  const search = async (id: string) => {
    setLoading(true); setError(""); setCoin(null); setChart([]); setRawPrices([]); setAnalysis(null);
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=${id}&price_change_percentage=7d`);
      const d = await r.json();
      if (!d.length) { setError("Coin not found. Try: bitcoin, ethereum, solana"); setLoading(false); return; }
      setCoin(d[0]);
      const cr = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=inr&days=30`);
      const cd = await cr.json();
      const prices: number[] = cd.prices.map(([,p]: [number,number]) => p);
      setRawPrices(prices);
      setChart(cd.prices.filter((_:unknown,i:number) => i%3===0).map(([t,p]: [number,number]) => ({
        date: new Date(t).toLocaleDateString("en-IN",{day:"numeric",month:"short"}),
        price: Math.round(p)
      })));
    } catch { setError("Failed to fetch. Try again."); }
    setLoading(false);
  };

  const runAI = async () => {
    if (!coin || !rawPrices.length) return;
    setAiLoading(true); setAnalysis(null);
    try {
      const res = await fetch("/api/market-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin: coin.name, symbol: coin.symbol,
          price: coin.current_price, change24h: coin.price_change_percentage_24h,
          change7d: coin.price_change_percentage_7d_in_currency,
          trend: calcTrend(rawPrices), volatility: calcVolatility(rawPrices),
          support: calcSupport(rawPrices), resistance: calcResistance(rawPrices),
          volumeToMcap: ((coin.total_volume/coin.market_cap)*100).toFixed(2),
          fromATH: coin.ath_change_percentage.toFixed(1),
          marketCap: coin.market_cap, investAmount: invest
        })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch { console.error("AI failed"); }
    setAiLoading(false);
  };

  const support = rawPrices.length ? calcSupport(rawPrices) : 0;
  const resistance = rawPrices.length ? calcResistance(rawPrices) : 0;
  const potentialGain = analysis ? Math.round(((analysis.targetPrice - coin!.current_price) / coin!.current_price) * invest) : 0;

  const verdictStyle = { BUY: "bg-green-500", HOLD: "bg-yellow-500", AVOID: "bg-red-500" };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Market Intelligence</h1>
        <p className="text-slate-400 mt-1">Live crypto prices · 30-day charts · Deep AI analysis</p>
      </div>

      <div className="flex gap-3 mb-4">
        <Input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(query.toLowerCase().trim())}
          placeholder="Search any crypto (bitcoin, ethereum, solana...)"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
        <Button onClick={() => search(query.toLowerCase().trim())} className="bg-purple-600 hover:bg-purple-700">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {POPULAR.map(c => (
          <button key={c} onClick={() => { setQuery(c); search(c); }}
            className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:border-purple-500 hover:text-purple-400 capitalize transition-all">
            {c.replace("-2","").replace("-network","")}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 rounded-xl p-4 text-sm mb-4">{error}</div>}

      {loading && (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching live market data...</p>
        </div>
      )}

      {coin && !loading && (
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-5">
                <img src={coin.image} alt={coin.name} className="w-12 h-12 rounded-full" />
                <div>
                  <h2 className="text-xl font-bold text-white">{coin.name}</h2>
                  <span className="text-sm text-slate-400 uppercase">{coin.symbol}</span>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-white">₹{coin.current_price.toLocaleString("en-IN")}</p>
                  <Badge className={coin.price_change_percentage_24h >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                    {coin.price_change_percentage_24h.toFixed(2)}% (24h)
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "24h High", value: `₹${coin.high_24h.toLocaleString("en-IN")}`, color: "text-green-400" },
                  { label: "24h Low", value: `₹${coin.low_24h.toLocaleString("en-IN")}`, color: "text-red-400" },
                  { label: "Market Cap", value: `₹${(coin.market_cap/1e12).toFixed(2)}T`, color: "text-blue-400" },
                  { label: "From ATH", value: `${coin.ath_change_percentage.toFixed(1)}%`, color: "text-orange-400" },
                ].map(item => (
                  <div key={item.label} className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {chart.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white text-sm">30-Day Price Chart (INR) — with Support & Resistance</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={65} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Price"]} />
                    <ReferenceLine y={support} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Support", fill: "#22c55e", fontSize: 10 }} />
                    <ReferenceLine y={resistance} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Resist", fill: "#ef4444", fontSize: 10 }} />
                    <Line type="monotone" dataKey="price" stroke="#a855f7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4">
              <label className="text-sm text-slate-400">Investment amount: ₹{invest.toLocaleString("en-IN")}</label>
              <input type="range" min="1000" max="500000" step="1000" value={invest}
                onChange={e => setInvest(Number(e.target.value))}
                className="w-full mt-2 accent-purple-500" />
            </CardContent>
          </Card>

          <Button onClick={runAI} disabled={aiLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 py-6 text-base font-semibold">
            {aiLoading ? "Running deep AI analysis..." : `Run AI Analysis on ${coin.name}`}
          </Button>

          {analysis && (
            <div className="space-y-4">
              <div className={`${verdictStyle[analysis.verdict]} rounded-2xl p-6 text-center`}>
                <p className="text-4xl font-black text-white mb-2">
                  {analysis.verdict === "BUY" ? "✅ BUY" : analysis.verdict === "HOLD" ? "⏸ HOLD" : "🚫 AVOID"}
                </p>
                <p className="text-white/90 text-sm">{analysis.verdictReason}</p>
                <p className="text-white/70 text-xs mt-2 italic">"{analysis.oneLineSummary}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader><CardTitle className="text-white text-sm">AI Scores</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Momentum", val: analysis.scores.momentum, color: "bg-blue-500" },
                      { label: "Risk", val: analysis.scores.risk, color: "bg-red-500" },
                      { label: "Liquidity", val: analysis.scores.liquidity, color: "bg-green-500" },
                      { label: "Potential", val: analysis.scores.potential, color: "bg-purple-500" },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{s.label}</span><span>{s.val}/10</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${s.val*10}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader><CardTitle className="text-white text-sm">Price Targets</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Entry", val: `₹${analysis.entryPrice.toLocaleString("en-IN")}`, color: "text-blue-400" },
                      { label: "Target", val: `₹${analysis.targetPrice.toLocaleString("en-IN")}`, color: "text-green-400" },
                      { label: "Stop Loss", val: `₹${analysis.stopLoss.toLocaleString("en-IN")}`, color: "text-red-400" },
                      { label: "Max Allocation", val: `${analysis.portfolioPercent}%`, color: "text-yellow-400" },
                    ].map(t => (
                      <div key={t.label} className="flex justify-between">
                        <span className="text-xs text-slate-400">{t.label}</span>
                        <span className={`text-xs font-bold ${t.color}`}>{t.val}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="text-white text-sm">Calculator for ₹{invest.toLocaleString("en-IN")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Potential Gain", val: `₹${potentialGain.toLocaleString("en-IN")}`, color: "text-green-400" },
                      { label: "Tax @ 30%", val: `₹${analysis.taxOnGain.toLocaleString("en-IN")}`, color: "text-red-400" },
                      { label: "After Tax", val: `₹${Math.max(0, potentialGain - analysis.taxOnGain).toLocaleString("en-IN")}`, color: "text-blue-400" },
                    ].map(c => (
                      <div key={c.label} className="bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                        <p className={`text-sm font-bold ${c.color}`}>{c.val}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader><CardTitle className="text-green-400 text-sm">Green Flags</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.greenFlags.map((f,i) => <li key={i} className="text-xs text-slate-300 flex gap-2"><span className="text-green-400">✓</span>{f}</li>)}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader><CardTitle className="text-red-400 text-sm">Red Flags</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.redFlags.map((f,i) => <li key={i} className="text-xs text-slate-300 flex gap-2"><span className="text-red-400">✗</span>{f}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}