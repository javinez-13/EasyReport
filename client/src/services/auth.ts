import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Interceptor to attach access token if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface RegisterRequest {
  email: string;
  username: string;
  fullname: string;
  phoneNumber: string;
  password?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "RESIDENT" | string;
  fullname?: string | null;
  phoneNumber?: string | null;
  isVerified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/register", data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/login", data);
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }
    if (res.data.refreshToken) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
    }
    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await api.post("/api/auth/logout", { refreshToken });
    } catch {
      // Ignore logout backend errors
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },

  refresh: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem("refreshToken");
    const res = await api.post<AuthResponse>("/api/auth/refresh", { refreshToken });
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }
    if (res.data.refreshToken) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
    }
    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const res = await api.get<AuthResponse>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/reset-password", { token, password });
    return res.data;
  },

  googleAuth: async (googleData: { googleId: string; email: string; fullname?: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/google", googleData);
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }
    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    try {
      const res = await api.get<AuthResponse>("/api/auth/me");
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        const refreshRes = await authApi.refresh();
        if (refreshRes.accessToken) {
          const retry = await api.get<AuthResponse>("/api/auth/me");
          return retry.data;
        }
      }
      throw err;
    }
  },
};

export default authApi;
