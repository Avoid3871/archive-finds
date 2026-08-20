"use client";

import { useState, useEffect, ReactNode, FormEvent } from "react";
import Link from "next/link";
import { 
  Lock, 
  Unlock, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Zap
} from "lucide-react";

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("archivefinds2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);

  // Check auth cookie/session immediately on mount
  useEffect(() => {
    let isMounted = true;

    // Fast client-side cookie or localStorage check
    if (
      (typeof document !== "undefined" && document.cookie.includes("af_admin_session=")) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("af_admin_session_active") === "true")
    ) {
      setIsAuthenticated(true);
    }

    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/auth", { cache: "no-store" });
        const data = await res.json();
        if (!isMounted) return;
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch {
        // fail silently
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e?: FormEvent, bypassPass?: string) => {
    if (e) e.preventDefault();
    const cleanPass = (bypassPass || passwordInput || "archivefinds2026").trim();

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: cleanPass }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Set client fallback cookie and localStorage
        if (typeof document !== "undefined") {
          document.cookie = "af_admin_session=active_operator; path=/; max-age=2592000; SameSite=Lax";
        }
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("af_admin_session_active", "true");
        }
        setIsAuthenticated(true);
      } else {
        setErrorMsg(data.error || "Incorrect passphrase. Access denied.");
        triggerShake();
      }
    } catch {
      // Local fallback unlock
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("af_admin_session_active", "true");
      }
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // If Authenticated -> Render Full Admin Dashboard
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Otherwise -> Immediately Render Clean Password Login Gate
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-neutral-800">
      {/* Subtle Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className={`relative w-full max-w-md bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-transform ${shake ? "animate-shake ring-2 ring-red-500/50" : ""}`}>
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-800/80 border border-neutral-700/60 rounded-lg text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono font-bold text-xs uppercase tracking-widest text-white flex items-center gap-1.5">
                AF // SECURE HUD
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              </span>
              <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Operator Authorization Required
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-neutral-800 text-neutral-400 border border-neutral-700 rounded">
            RESTRICTED
          </span>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleLogin(e)} className="mt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                htmlFor="admin-password" 
                className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold"
              >
                Operator Passphrase
              </label>
              <button
                type="button"
                onClick={() => handleLogin(undefined, "archivefinds2026")}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>1-Click Auto Unlock</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Enter master password..."
                autoFocus
                autoComplete="current-password"
                className="w-full px-3.5 py-3 pr-10 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300 font-mono animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Unlocking HUD...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Admin HUD</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer return link & security hint */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
          <Link
            href="/"
            className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>

          <span className="text-[10px] text-neutral-500 font-mono">
            Pass: archivefinds2026
          </span>
        </div>
      </div>
    </div>
  );
}
