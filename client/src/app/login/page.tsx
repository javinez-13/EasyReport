"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({
        username: username.trim(),
        password,
      });

      if (response.success && response.user) {
        setSuccess("Login successful! Redirecting...");
        const role = response.user.role.toUpperCase();

        setTimeout(() => {
          if (role === "ADMIN") {
            router.push("/admin/dashboard");
          } else {
            router.push("/client");
          }
        }, 800);
      } else {
        setError(response.message || "Invalid credentials.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "An error occurred during login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
        {/* Left Column - Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome to <span className="font-semibold text-blue-600">Barangay EasyReport</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border-l-4 border-green-500 rounded-r">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full px-4 py-3 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 focus:outline-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.04 10.04 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.108-6.108a3 3 0 104.243 4.243"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div className="text-left">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0066ff] hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Right Column - Official Barangay Logo Banner */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-100 relative">
          <div className="w-96 h-96 relative flex items-center justify-center p-4">
            <Image
              src="/barangaylogo.jpg"
              alt="Barangay Gabi Cordova Official Seal"
              width={280}
              height={280}
              className="object-contain drop-shadow-md rounded-full"
              priority
            />
          </div>
          <div className="text-center mt-6">
            <h2 className="text-xl font-bold text-gray-800 tracking-wide uppercase">
              Republic of the Philippines
            </h2>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Barangay Gabi, Cordova, Cebu
            </p>
            <p className="text-xs text-gray-400 mt-3 font-semibold uppercase tracking-wider">
              Official Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
