"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, signInData.email, signInData.password);
      toast.success("Welcome back to FinZen!");
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password);
      await updateProfile(cred.user, { displayName: signUpData.name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name: signUpData.name,
        email: signUpData.email,
        createdAt: new Date().toISOString(),
        portfolio: [],
        savedPolicies: [],
      });
      toast.success("Account created! Welcome to FinZen!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FinZen</h1>
          <p className="text-slate-400">Your Gen-Z Financial Intelligence Platform</p>
        </div>
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Get Started</CardTitle>
            <CardDescription className="text-slate-400">Sign in or create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="w-full bg-slate-700">
                <TabsTrigger value="signin" className="w-full">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="w-full">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input className="bg-slate-700 border-slate-600 text-white mt-1"
                      type="email" placeholder="you@example.com"
                      value={signInData.email}
                      onChange={e => setSignInData({...signInData, email: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-slate-300">Password</Label>
                    <Input className="bg-slate-700 border-slate-600 text-white mt-1"
                      type="password" placeholder="••••••••"
                      value={signInData.password}
                      onChange={e => setSignInData({...signInData, password: e.target.value})} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-slate-300">Full Name</Label>
                    <Input className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Krish Garg"
                      value={signUpData.name}
                      onChange={e => setSignUpData({...signUpData, name: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input className="bg-slate-700 border-slate-600 text-white mt-1"
                      type="email" placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={e => setSignUpData({...signUpData, email: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-slate-300">Password</Label>
                    <Input className="bg-slate-700 border-slate-600 text-white mt-1"
                      type="password" placeholder="Min 6 characters"
                      value={signUpData.password}
                      onChange={e => setSignUpData({...signUpData, password: e.target.value})} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}