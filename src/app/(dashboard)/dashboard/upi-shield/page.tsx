"use client";
import { useState, useRef } from "react";
import { Shield, Upload, AlertTriangle, CheckCircle, XCircle, Camera, Search } from "lucide-react";

type FraudResult = {
  trustScore: number;
  verdict: "SAFE" | "SUSPICIOUS" | "DANGEROUS";
  merchantName: string;
  merchantType: string;
  bankName: string;
  accountAge: string;
  riskFactors: string[];
  safeIndicators: string[];
  recommendation: string;
  detailedAnalysis: string;
  shouldPay: boolean;
};

const RECENT = ["zomato@zomato", "amazon@apl", "swiggy@icici"];

export default function UPIShieldPage() {
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true); setResult(null); setError("");
    try {
      const res = await fetch("/api/upi-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: id.trim() })
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError("Analysis failed. Please try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const handleQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setLoading(true); setResult(null); setError("");
      try {
        const res = await fetch("/api/upi-qr-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 })
        });
        const data = await res.json();
        if (data.upiId) { setUpiId(data.upiId); await analyze(data.upiId); }
        else setError("Could not read QR code. Please try a clearer image.");
      } catch { setError("QR scan failed."); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const scoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 40 ? "#eab308" : "#ef4444";
  const verdictConfig = {
    SAFE: { color: "text-green-400", bg: "bg-green-900/20 border-green-500/40", icon: <CheckCircle className="w-5 h-5 text-green-400" />, label: "Safe to Pay" },
    SUSPICIOUS: { color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-500/40", icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, label: "Proceed with Caution" },
    DANGEROUS: { color: "text-red-400", bg: "bg-red-900/20 border-red-500/40", icon: <XCircle className="w-5 h-5 text-red-400" />, label: "Do NOT Pay" },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          UPI Fraud Shield
        </h1>
        <p className="text-slate-400 mt-1 ml-13">AI-powered fraud detection for any UPI ID or QR code</p>
      </div>

      {/* Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus-within:border-purple-500 transition-colors">
           <Search className="w-4 h-4 text-white flex-shrink-0" />
            <input value={upiId} onChange={e => setUpiId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyze(upiId)}
              placeholder="Enter UPI ID (e.g. store@paytm, shop@okaxis)"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white focus:outline-none" />
          </div>
          <button onClick={() => analyze(upiId)} disabled={loading || !upiId}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all">
            {loading ? "..." : "Check"}
          </button>
        </div>

        <div className="text-xs text-white mb-3">Recent examples:</div>
        <div className="flex gap-2 mb-4">
          {RECENT.map(r => (
            <button key={r} onClick={() => { setUpiId(r); analyze(r); }}
              className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-all">
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-white">or scan QR code</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-5 flex flex-col items-center gap-2 transition-all group">
            <Upload className="w-6 h-6 text-white group-hover:text-purple-400 transition-colors" />
            <span className="text-sm text-white group-hover:text-purple-400 transition-colors">Upload QR Image</span>
            <span className="text-xs text-white">PNG, JPG supported</span>
          </button>
          <div className={`rounded-xl overflow-hidden border-2 ${qrPreview ? "border-purple-500/50" : "border-dashed border-slate-700"} flex items-center justify-center`}>
            {qrPreview
              ? <img src={qrPreview} alt="QR" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-2 p-5">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-xs text-white">QR preview</span>
                </div>
            }
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleQR} className="hidden" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10">
          <div className="w-14 h-14 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">AI analyzing UPI patterns and fraud indicators...</p>
          <p className="text-white text-xs mt-1">Checking merchant history, bank trust scores, and risk patterns</p>
        </div>
      )}

      {/* Error */}
      {error && <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 text-red-400 text-sm mb-4">{error}</div>}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-3">
          {/* Main verdict */}
          <div className={`border-2 rounded-2xl p-5 ${verdictConfig[result.verdict].bg}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {verdictConfig[result.verdict].icon}
                <div>
                  <p className={`font-bold text-lg ${verdictConfig[result.verdict].color}`}>
                    {verdictConfig[result.verdict].label}
                  </p>
                  <p className="text-slate-400 text-sm">{result.merchantName} · {result.bankName}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black" style={{ color: scoreColor(result.trustScore) }}>
                  {result.trustScore}
                </div>
                <div className="text-xs text-slate-500">/ 100</div>
                <div className="text-xs text-slate-500">Trust Score</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
              <div className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${result.trustScore}%`, backgroundColor: scoreColor(result.trustScore) }} />
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Merchant Type", val: result.merchantType },
                { label: "Bank", val: result.bankName },
                { label: "Account Age", val: result.accountAge },
              ].map(info => (
                <div key={info.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">{info.label}</p>
                  <p className="text-xs font-medium text-white mt-0.5">{info.val}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-xl p-3 text-sm font-medium ${result.shouldPay ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
              {result.recommendation}
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-green-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Safe Indicators
              </p>
              {result.safeIndicators.length > 0
                ? result.safeIndicators.map((s,i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-300 mb-1.5">
                      <span className="text-green-400 flex-shrink-0">✓</span>{s}
                    </div>
                  ))
                : <p className="text-xs text-white">None found</p>
              }
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-red-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors
              </p>
              {result.riskFactors.length > 0
                ? result.riskFactors.map((r,i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-300 mb-1.5">
                      <span className="text-red-400 flex-shrink-0">✗</span>{r}
                    </div>
                  ))
                : <p className="text-xs text-white">None detected</p>
              }
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium mb-2">Detailed Analysis</p>
            <p className="text-slate-300 text-sm leading-relaxed">{result.detailedAnalysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}