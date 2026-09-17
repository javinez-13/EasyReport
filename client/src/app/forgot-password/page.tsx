"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { authApi } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.message || "Reset link sent if account exists.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Forgot Password</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Enter your registered email address to receive password reset instructions.
        </p>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border-l-4 border-green-500 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@gmail.com"
              className="w-full px-4 py-3 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
          >
            {loading ? "Sending..." : "Send Reset Instructions"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
