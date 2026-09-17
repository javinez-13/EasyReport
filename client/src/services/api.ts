import axios from "axios";
import { authApi } from "@/services/auth";
import type {
  ActivityLog,
  AuthUser,
  Complaint,
  Hearing,
  MonthlyAnalytics,
  Notification,
  PersonInfo,
  Resident,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== "undefined" && config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

// Response interceptor to attempt token refresh on 401 and retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) return Promise.reject(error);

    const url = String(originalRequest.url || "");
    const isAuthRefresh = url.includes("/api/auth/refresh") || url.includes("/api/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRefresh) {
      originalRequest._retry = true;
      try {
        const refreshRes = await authApi.refresh();
        if (refreshRes?.accessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${refreshRes.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface DashboardData {
  stats: {
    pending: number;
    inProgress: number;
    scheduled: number;
    resolved: number;
    cancelled: number;
    unsettled: number;
    total: number;
  };
  statusOverview: { status: string; count: number }[];
  monthlyAnalytics: MonthlyAnalytics[];
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  year?: number | string;
  month?: number | string;
}

export interface HearingAnalytics {
  totalHearings: number;
  complaintsWithHearings: number;
  avgHearingsPerCase: number;
  hearingsByStage: {
    stageNumber: number;
    stage: string;
    count: number;
  }[];
  hearingsByMediator: {
    mediator: string;
    count: number;
  }[];
}

export interface CategoryPerformanceItem {
  category: string;
  total: number;
  resolved: number;
  inProgress: number;
  unsettled: number;
  rate: number;
  avgDays: number;
}

export interface SlaCompliance {
  totalCases: number;
  within15Days: number;
  within30Days: number;
  over30Days: number;
  activeOverdue: number;
  complianceRate: number;
}

export interface ReportsData {
  stats: {
    totalComplaints: number;
    resolvedCases: number;
    pendingCases: number;
    inProgressCases: number;
    scheduledCases: number;
    cancelledCases: number;
    unsettledCases: number;
    avgResolutionTime: number;
    resolvedRate: number;
    activeCases: number;
  };
  statusCounts: Record<string, number>;
  monthlyAnalytics: MonthlyAnalytics[];
  categoryReports: { category: string; total: number }[];
  priorityReports: { priority: string; cases: number }[];
  hearingAnalytics: HearingAnalytics;
  categoryPerformance: CategoryPerformanceItem[];
  slaCompliance: SlaCompliance;
  complaints: Complaint[];
  filters: ReportFilters;
}

export interface Summon {
  id: string;
  summonNo: string;
  complaintId: string;
  complaintNo: string;
  complainant: string;
  respondent: string;
  hearingDate: string;
  hearingTime: string;
  venue: string;
  officer: string;
}

export const complaintsApi = {
  getAll: (filters?: { search?: string; status?: string; priority?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.category) params.append("category", filters.category);
    const queryString = params.toString();
    return api
      .get<Complaint[]>(`/api/complaints${queryString ? `?${queryString}` : ""}`)
      .then((r) => r.data);
  },
  getCategories: () =>
    api.get<string[]>("/api/complaints/categories").then((r) => r.data),
  getRecent: (limit = 10) =>
    api.get<Complaint[]>(`/api/complaints/recent?limit=${limit}`).then((r) => r.data),
  getById: (id: string) =>
    api.get<Complaint>(`/api/complaints/${id}`).then((r) => r.data),
  getDashboard: () =>
    api.get<DashboardData>("/api/complaints/dashboard").then((r) => r.data),
  approve: (id: string) =>
    api.put<Complaint>(`/api/admin/complaints/${id}/approve`).then((r) => r.data),
  reject: (id: string) =>
    api.put<Complaint>(`/api/admin/complaints/${id}/reject`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch<Complaint>(`/api/complaints/${id}/status`, { status }).then((r) => r.data),
  updateRespondent: (id: string, respondentInfo: Partial<PersonInfo>) =>
    api.patch<Complaint>(`/api/complaints/${id}/respondent`, respondentInfo).then((r) => r.data),
};

export const hearingsApi = {
  getScheduled: () =>
    api.get<Hearing[]>("/api/hearings/scheduled").then((r) => r.data),
  getByComplaint: (complaintId: string) =>
    api.get<Hearing[]>(`/api/hearings/complaint/${complaintId}`).then((r) => r.data),
  save: (data: {
    complaintId: string;
    hearingNumber?: number;
    hearingDate?: string;
    hearingTime?: string;
    timeConsumed?: string;
    assignedMediator?: string;
    venue?: string;
    witnesses?: string[];
    decision?: string;
    mediationNotes?: string;
    complaintStatus?: string;
    status?: string;
  }) => api.post<Hearing>("/api/hearings", data).then((r) => r.data),
};

export const summonsApi = {
  create: (data: {
    complaintId: string;
    hearingDate: string;
    hearingTime: string;
    venue: string;
    officer: string;
    summonNo?: string;
  }) => api.post<Summon>("/api/summons", data).then((r) => r.data),
  getByComplaint: (complaintId: string) =>
    api.get<Summon>(`/api/summons/complaint/${complaintId}`).then((r) => r.data),
  notify: (complaintId: string) =>
    api.post(`/api/summons/${complaintId}/notify`).then((r) => r.data),
};

export const reportsApi = {
  getAll: (filters?: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.status && filters.status !== "All") params.append("status", filters.status);
    if (filters?.priority && filters.priority !== "All") params.append("priority", filters.priority);
    if (filters?.category && filters.category !== "All") params.append("category", filters.category);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.year) params.append("year", String(filters.year));
    if (filters?.month) params.append("month", String(filters.month));
    const query = params.toString();
    return api
      .get<ReportsData>(`/api/reports${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
};

export const clientApi = {
  getProfile: () => api.get<AuthUser>("/api/client/profile").then((r) => r.data),
  updateProfile: (data: {
    fullname?: string;
    email?: string;
    phoneNumber?: string | null;
  }) => api.put<AuthUser>("/api/client/profile", data).then((r) => r.data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append("profilePicture", file);
    return api
      .post<AuthUser>("/api/client/profile/picture", formData)
      .then((r) => r.data);
  },
  getComplaints: (filters?: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.limit) params.append("limit", String(filters.limit));
    const queryString = params.toString();
    return api
      .get<Complaint[]>(`/api/client/complaints${queryString ? `?${queryString}` : ""}`)
      .then((r) => r.data);
  },
  getComplaintById: (id: string) =>
    api.get<Complaint>(`/api/client/complaints/${id}`).then((r) => r.data),
  createComplaint: (data: {
    category: string;
    priority: string;
    respondentName: string;
    respondentAddress?: string;
    respondentContact?: string;
    respondentEmail?: string;
    respondentAge?: number;
    description?: string;
    evidenceFiles?: File[];
  }) => {
    const formData = new FormData();
    formData.append("category", data.category);
    formData.append("priority", data.priority);
    formData.append("respondentName", data.respondentName);
    if (data.respondentAddress) formData.append("respondentAddress", data.respondentAddress);
    if (data.respondentContact) formData.append("respondentContact", data.respondentContact);
    if (data.respondentEmail) formData.append("respondentEmail", data.respondentEmail);
    if (data.respondentAge != null) formData.append("respondentAge", String(data.respondentAge));
    if (data.description) formData.append("description", data.description);
    (data.evidenceFiles || []).forEach((file) => formData.append("evidence", file));
    return api.post<Complaint>("/api/client/complaints", formData).then((r) => r.data);
  },
  getNotifications: () =>
    api.get<Notification[]>("/api/client/notifications").then((r) => r.data),
  getActivity: () =>
    api.get<ActivityLog[]>("/api/client/activity").then((r) => r.data),
};

export const residentsApi = {
  getAll: () => api.get<Resident[]>("/api/residents").then((r) => r.data),
  getById: (id: string) =>
    api.get<Resident>(`/api/residents/${id}`).then((r) => r.data),
  create: (data: Partial<Resident>) =>
    api.post<Resident>("/api/residents", data).then((r) => r.data),
  update: (id: string, data: Partial<Resident>) =>
    api.put<Resident>(`/api/residents/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/residents/${id}`).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api
      .post<Resident>(`/api/residents/${id}/photo`, formData)
      .then((r) => r.data);
  },
};

// Resolves a stored upload path (e.g. "/uploads/residents/x.jpg") to a
// URL the browser can load. Blob previews and absolute URLs pass through.
export function uploadImageUrl(path?: string): string {
  if (!path) return "";
  if (/^(blob:|data:|https?:\/\/)/.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export default api;

