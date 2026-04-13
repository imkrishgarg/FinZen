"use client";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, AlertCircle, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

type PolicyAnalysis = {
  policyType: string;
  insurer: string;
  covered: string[];
  notCovered: string[];
  hiddenClauses: string[];
  premiumWorth: "GOOD" | "AVERAGE" | "POOR";
  overallRating: number;
  plainSummary: string;
  redAlerts: string[];
};

export default function InsurancePage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<PolicyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const decode = async () => {
    if (!text) return;
    setLoading(true); setAnalysis(null);
    try {
      const res = await fetch("/api/insurance-decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyText: text.slice(0, 4000) })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch { console.error("Decode failed"); }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question || !text) return;
    setQaLoading(true); setAnswer("");
    try {
      const res = await fetch("/api/insurance-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyText: text.slice(0, 4000), question })
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch { console.error("QA failed"); }
    setQaLoading(false);
  };

  const quickQs = [
    "What is NOT covered?", "Are pre-existing diseases covered?",
    "What is the waiting period?", "Is this policy worth buying?"
  ];

  const ratingColor = (r: number) => r >= 7 ? "text-green-400" : r >= 5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400" /> Policy Decoder
        </h1>
        <p className="text-slate-400 mt-1">Upload any insurance policy — AI explains it in plain language</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardContent className="pt-6">
          <button onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-500 transition-all">
            <Upload className="w-8 h-8 text-slate-400" />
            <div className="text-center">
              <p className="text-white font-medium">{fileName || "Click to upload policy document"}</p>
              <p className="text-slate-500 text-sm mt-1">.txt, .pdf files supported</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".txt,.pdf" onChange={handleFile} className="hidden" />

          {text && (
            <div className="mt-4">
              <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400 max-h-24 overflow-y-auto">
                {text.slice(0, 300)}...
              </div>
              <Button onClick={decode} disabled={loading} className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                {loading ? "Decoding policy..." : "Decode This Policy"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">AI reading and analyzing your policy...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-slate-900 border-slate-800 text-center">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-500 mb-1">Policy Type</p>
                <p className="text-white font-bold text-sm">{analysis.policyType}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-center">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-500 mb-1">Insurer</p>
                <p className="text-white font-bold text-sm">{analysis.insurer}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-center">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-500 mb-1">Overall Rating</p>
                <p className={`font-black text-2xl ${ratingColor(analysis.overallRating)}`}>{analysis.overallRating}/10</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-white text-sm">Plain Language Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.plainSummary}</p>
            </CardContent>
          </Card>

          {analysis.redAlerts.length > 0 && (
            <Card className="bg-red-900/20 border-red-500/50">
              <CardHeader><CardTitle className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />Red Alerts — Read Before Signing</CardTitle></CardHeader>
              <CardContent>
                {analysis.redAlerts.map((a,i) => (
                  <div key={i} className="flex gap-2 text-sm text-red-300 mb-2"><span>⚠</span>{a}</div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />What IS Covered</CardTitle></CardHeader>
              <CardContent>
                {analysis.covered.map((c,i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-300 mb-2"><span className="text-green-400">✓</span>{c}</div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-red-900/10 border-red-500/30">
              <CardHeader><CardTitle className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" />What is NOT Covered</CardTitle></CardHeader>
              <CardContent>
                {analysis.notCovered.map((c,i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-300 mb-2"><span className="text-red-400">✗</span>{c}</div>
                ))}
              </CardContent>
            </Card>
          </div>

          {analysis.hiddenClauses.length > 0 && (
            <Card className="bg-yellow-900/10 border-yellow-500/30">
              <CardHeader><CardTitle className="text-yellow-400 text-sm">Hidden Clauses</CardTitle></CardHeader>
              <CardContent>
                {analysis.hiddenClauses.map((c,i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-300 mb-2"><span className="text-yellow-400">!</span>{c}</div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4" />Ask About This Policy</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickQs.map(q => (
                  <button key={q} onClick={() => { setQuestion(q); }}
                    className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-all">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask anything about this policy..."
                  className="bg-slate-800 border-slate-700 text-white" />
                <Button onClick={askQuestion} disabled={qaLoading} className="bg-blue-600 hover:bg-blue-700">Ask</Button>
              </div>
              {answer && (
                <div className="mt-3 bg-slate-800 rounded-lg p-3 text-sm text-slate-300 leading-relaxed">{answer}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}