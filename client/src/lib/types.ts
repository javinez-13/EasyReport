export type ComplaintStatus =
  | "Pending"
  | "In Progress"
  | "Scheduled"
  | "Resolved"
  | "Cancelled"
  | "Unsettled";

export type Priority = "High" | "Medium" | "Low" | "Normal" | "Critical";

export interface PersonInfo {
  name: string;
  age: number;
  address: string;
  contact: string;
  email?: string;
}

export interface Complaint {
  id: string;
  complaintNo: string;
  dateFiled: string;
  complainant: string;
  complainantInfo: PersonInfo;
  respondent: string;
  respondentInfo: PersonInfo;
  category: string;
  priority: Priority;
  status: ComplaintStatus;
  description: string;
  evidence: string[];
  latestHearingNumber?: number;
  hearingDate?: string;
  hearingTime?: string;
  venue?: string;
  summonNo?: string;
  mediationNotes?: string;
  previousHearingNotes?: string;
  witnesses?: string[];
}

export interface Hearing {
  id: string;
  complaintId: string;
  complaintNo?: string;
  complainant?: string;
  respondent?: string;
  date: string;
  time: string;
  timeConsumed?: string;
  assignedMediator?: string;
  venue: string;
  hearingNumber: number;
  witnesses?: string[];
  decision?: string;
  mediationNotes?: string;
  previousNotes?: string;
  status?: string;
}

export interface Resident {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  fullName: string;
  birthdate: string;
  birthPlace?: string;
  age: number;
  gender: string;
  civilStatus: string;
  nationality?: string;
  religion?: string;
  occupation?: string;
  address: string;
  contactNumber: string;
  email: string;
  pwdIdNo?: string;
  familyMonthlyIncome?: string;
  indigent?: string;
  registeredVoter?: string;
  precinctNo?: string;
  voterIdNo?: string;
  photoUrl?: string;
  householdNumber?: string;
  emergencyContact?: string;
  dateRegistered?: string;
  // Account registration status, derived from the User <-> Resident
  // relationship (linked user => REGISTERED). Separate from
  // registeredVoter, which tracks barangay voter records.
  userId?: number | null;
  isRegistered?: boolean;
}

export interface Notification {
  id: number;
  complaintId?: number;
  recipient?: string;
  message?: string;
  type?: string;
  sentAt?: string;
  complaintNo?: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: any;
  createdAt?: string;
  complaintNo?: string;
  category?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "RESIDENT" | string;
  fullname?: string | null;
  phoneNumber?: string | null;
  isVerified?: boolean;
  location?: string | null;
  profilePicture?: string | null;
}

export interface DashboardStats {
  activeCases: number;
  pendingApproval: number;
  inProgress: number;
  resolvedCases: number;
}

export interface MonthlyAnalytics {
  month: string;
  complaints: number;
  pending?: number;
  inProgress?: number;
  scheduled?: number;
  resolved?: number;
  cancelled?: number;
  unsettled?: number;
}

export interface CategoryReport {
  category: string;
  total: number;
}

export interface PriorityReport {
  priority: Priority;
  cases: number;
}
