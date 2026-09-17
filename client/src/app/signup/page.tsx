"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/auth";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validations
    if (!fullname.trim() || !email.trim() || !username.trim() || !phoneNumber.trim() || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Role is NEVER sent in registration payload; backend strictly enforces RESIDENT
      // residentId is NEVER sent either: the backend verifies identity via
      // Full Name + Email + Phone against the barangay resident records.
      const response = await authApi.register({
        email: email.trim(),
        username: username.trim(),
        fullname: fullname.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });

      if (response.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(response.message || "Registration failed.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "An error occurred during registration."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[650px]">
        {/* Left Column - Signup Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Join <span className="font-semibold text-blue-600">Barangay EasyReport</span> as a Resident
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 text-sm text-green-700 bg-green-50 border-l-4 border-green-500 rounded-r">
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-xl capitalize text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Must exactly match the name registered with the barangay.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@gmail.com"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="juan123"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09123456789"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 focus:outline-none"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0066ff] hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? "Creating account..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Login
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
              Barangay EasyReport Portal
            </h2>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Barangay Gabi, Cordova, Cebu
            </p>
            <p className="text-xs text-gray-400 mt-3 font-semibold uppercase tracking-wider">
              Resident Account Registration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
