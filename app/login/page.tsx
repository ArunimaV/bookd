"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { C, FONT_LINK } from "@/dashboard/theme";
import { globalStyles } from "@/dashboard/styles";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const supabase = createBrowserSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: undefined },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Auto sign-in right after sign-up
      const { error: autoSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (autoSignInError) {
        setError(autoSignInError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    // Success — navigate to dashboard, refresh to pick up new cookies
    router.push("/");
    router.refresh();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontSize: 15,
    fontFamily: C.body,
    border: `1px solid ${C.border}`,
    borderRadius: C.radiusSm,
    background: C.card,
    color: C.text,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: C.textSoft,
    fontFamily: C.body,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{globalStyles}</style>
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: C.body,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: C.card,
            borderRadius: C.radius,
            boxShadow: C.shadowLg,
            padding: "40px 36px",
          }}
        >
          {/* Header */}
          <h1
            style={{
              fontFamily: C.heading,
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: C.textMuted,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            {isSignUp
              ? "Sign up to set up your AI receptionist"
              : "Sign in to your Bookd dashboard"}
          </p>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: C.redLight,
                color: C.red,
                padding: "12px 16px",
                borderRadius: C.radiusSm,
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                required
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder=""
                required
                style={inputStyle}
              />
            </div>

            {isSignUp && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder=""
                  required
                  style={inputStyle}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: C.body,
                background: loading ? C.textMuted : C.accent,
                color: "#FFFFFF",
                border: "none",
                borderRadius: C.radiusSm,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                marginTop: 8,
              }}
            >
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Sign Up"
                : "Sign In"}
            </button>
          </form>

          {/* Toggle sign-in / sign-up */}
          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 14,
              color: C.textMuted,
            }}
          >
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: C.accent,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: C.body,
                fontSize: 14,
                padding: 0,
              }}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
