// web/src/lib/api.ts

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://web-production-e0302.up.railway.app");

const STAFF_KEY: string =
  (import.meta.env.VITE_STAFF_KEY as string | undefined) ??
  (import.meta.env.DEV ? "dev-staff-key" : "");

const TOKEN_KEY = "access_token";
const TOKEN_KEY_SESSION = "access_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY_SESSION);
}

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY_SESSION, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY_SESSION);
  }
}

export function logout() {
  setAccessToken(null);
}

export function debugAuth() {
  const t = getAccessToken();
  return {
    hasToken: !!t,
    tokenPrefix: t ? `${t.slice(0, 12)}…` : null,
    apiUrl: API_URL,
    hasStaffKey: !!STAFF_KEY,
  };
}

export type ApiOk = { ok: true };
export type ApiErr = { ok: false; detail?: string };
type RequestOptions = Omit<RequestInit, "body"> & { json?: any };

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    const text = await res.text().catch(() => "");
    return text || `${res.status} ${res.statusText}`;
  }
}

function joinUrl(baseUrl: string, path: string) {
  const base = (baseUrl || "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function request<T>(
  path: string,
  opts: RequestOptions = {},
  useAuth: boolean = true,
  useStaffKey: boolean = true
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  const hasJsonBody = opts.json !== undefined;

  if (hasJsonBody) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (useAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Keep staff access working for complaints, officers, case notes, and reports.
  // Only login/OTP skip this. User management still also requires admin token on backend.
  if (useStaffKey && STAFF_KEY) {
    headers.set("X-Staff-Key", STAFF_KEY);
  }

  const res = await fetch(joinUrl(API_URL, path), {
    method: opts.method ?? "GET",
    ...opts,
    headers,
    body: hasJsonBody ? JSON.stringify(opts.json) : undefined,
  });

  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return null as unknown as T;

  const text = await res.text().catch(() => "");
  return (text ? JSON.parse(text) : null) as T;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (STAFF_KEY) headers.set("X-Staff-Key", STAFF_KEY);

  const res = await fetch(joinUrl(API_URL, path), {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) throw new Error(await parseError(res));
  const text = await res.text().catch(() => "");
  return (text ? JSON.parse(text) : null) as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (STAFF_KEY) headers.set("X-Staff-Key", STAFF_KEY);

  const res = await fetch(joinUrl(API_URL, path), {
    method: "GET",
    headers,
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}

export type Officer = {
  id: number;
  first_name: string;
  last_name: string;
  badge_number?: string | null;
  department?: string | null;
  unit?: string | null;
};

export type Complaint = {
  officer_ids: any;
  id: number;
  case_number: string;
  complainant_first_name: string;
  complainant_last_name: string;
  complainant_phone?: string | null;
  phone_number?: string | null;
  stop_date: string;
  stop_time?: string | null;
  department: string;
  unit?: string | null;
  stop_location?: string | null;
  narrative?: string | null;
  harm_done?: string | null;
  harm_types?: string[] | null;
  status?: string | null;
  officers?: Officer[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type CaseNote = {
  id: number;
  entity_type: "complaint" | "officer";
  entity_id: number;
  note_text: string;
  note_type?: string | null;
  note_date?: string | null;
  created_at?: string | null;
  is_deleted?: boolean;
};

export type CaseNoteCreate = {
  entity_type: "complaint" | "officer";
  entity_id: number;
  note_text: string;
  note_type?: string | null;
  note_date?: string;
};



export type ComplaintDocumentSection =
  | "original_complaint"
  | "internal_affairs"
  | "cpp"
  | "final_disposition";

export type ComplaintDocument = {
  id: number;
  complaint_id: number;
  section: ComplaintDocumentSection;
  original_filename: string;
  content_type?: string | null;
  file_size: number;
  created_at?: string | null;
};

export type ComplaintFollowUp = {
  id?: number;
  complaint_id: number;
  original_submitted_date?: string | null;
  original_submitted_to: string[];
  original_case_note?: string | null;
  ia_case_number?: string | null;
  ia_status?: string | null;
  ia_case_note?: string | null;
  cpp_case_number?: string | null;
  cpp_status?: string | null;
  cpp_case_note?: string | null;
  disposition_date?: string | null;
  disposition_findings: Array<{
    finding: string;
    description: string;
  }>;
  disposition_case_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type StaffUser = {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_verified: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type StaffUserCreate = {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
};

export type StaffUserUpdate = {
  email?: string;
  full_name?: string;
  is_admin?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
};

export const api = {
  register: (payload: { email: string; password: string; full_name?: string }) =>
    request<ApiOk>(`/auth/register`, { method: "POST", json: payload }, false, true),

  login: (payload: { email: string; password: string }) =>
    request<{ ok: true; email: string }>(`/auth/login`, { method: "POST", json: payload }, false, false),

  verifyOtp: async (payload: { email: string; otp_code: string }) => {
    const res = await request<{ ok: true; access_token: string }>(
      `/auth/verify-otp`,
      { method: "POST", json: payload },
      false,
      false
    );
    if (!res?.access_token) throw new Error("OTP verified but server did not return access_token");
    setAccessToken(res.access_token);
    return res;
  },

  forgotPassword: (payload: { email: string }) =>
    request<ApiOk>(`/auth/forgot-password`, { method: "POST", json: payload }, false, false),

  resetPassword: (payload: { email: string; code: string; new_password: string }) =>
    request<ApiOk>(`/auth/reset-password`, { method: "POST", json: payload }, false, false),

  me: () => request<StaffUser>(`/auth/me`, { method: "GET" }, true, false),

  listComplaints: (q: string = "") =>
    request<Complaint[]>(`/complaints${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getComplaint: (id: number) => request<Complaint>(`/complaints/${id}`),
  createComplaint: (payload: any) => request<Complaint>(`/complaints`, { method: "POST", json: payload }),
  updateComplaint: (id: number, payload: Partial<Complaint>) =>
    request<Complaint>(`/complaints/${id}`, { method: "PATCH", json: payload }),
  deleteComplaint: (id: number) =>
    request<{ ok: true; deleted_id: number }>(`/complaints/${id}`, { method: "DELETE" }),


  getComplaintFollowUp: (complaintId: number) =>
    request<ComplaintFollowUp>(`/complaints/${complaintId}/follow-up`),
  updateComplaintFollowUp: (complaintId: number, payload: Partial<ComplaintFollowUp>) =>
    request<ComplaintFollowUp>(`/complaints/${complaintId}/follow-up`, {
      method: "PATCH",
      json: payload,
    }),


  listComplaintDocuments: (
    complaintId: number,
    section?: ComplaintDocumentSection
  ) =>
    request<ComplaintDocument[]>(
      `/complaints/${complaintId}/documents${
        section ? `?section=${encodeURIComponent(section)}` : ""
      }`
    ),
  uploadComplaintDocument: (
    complaintId: number,
    section: ComplaintDocumentSection,
    file: File
  ) => {
    const formData = new FormData();
    formData.append("section", section);
    formData.append("file", file);
    return requestForm<ComplaintDocument>(
      `/complaints/${complaintId}/documents`,
      formData
    );
  },
  downloadComplaintDocument: (documentId: number) =>
    requestBlob(`/complaint-documents/${documentId}/download`),
  deleteComplaintDocument: (documentId: number) =>
    request<{ ok: true; deleted_id: number }>(
      `/complaint-documents/${documentId}`,
      { method: "DELETE" }
    ),

  listOfficers: (q: string = "") =>
    request<Officer[]>(`/officers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getOfficer: (id: number) => request<Officer>(`/officers/${id}`),
  createOfficer: (payload: any) => request<Officer>(`/officers`, { method: "POST", json: payload }),
  updateOfficer: (id: number, payload: Partial<Officer>) =>
    request<Officer>(`/officers/${id}`, { method: "PATCH", json: payload }),
  deleteOfficer: (id: number) =>
    request<{ ok: true; deleted_id: number }>(`/officers/${id}`, { method: "DELETE" }),

  listCaseNotes: (entityType: "complaint" | "officer", entityId: number) =>
    request<CaseNote[]>(
      `/case-notes?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(String(entityId))}`
    ),
  addCaseNote: (payload: CaseNoteCreate) =>
    request<CaseNote>(`/case-notes`, {
      method: "POST",
      json: { ...payload, note_date: payload.note_date ?? new Date().toISOString().slice(0, 10) },
    }),

  listUsers: (q: string = "") =>
    request<StaffUser[]>(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createUser: (payload: StaffUserCreate) =>
    request<StaffUser>(`/users`, { method: "POST", json: payload }),
  updateUser: (id: number, payload: StaffUserUpdate) =>
    request<StaffUser>(`/users/${id}`, { method: "PATCH", json: payload }),
  resetUserPassword: (id: number, new_password: string) =>
    request<{ ok: true }>(`/users/${id}/password`, { method: "PATCH", json: { new_password } }),
  deleteUser: (id: number) =>
    request<{ ok: true; deleted_id: number }>(`/users/${id}`, { method: "DELETE" }),

  logout: () => logout(),
};
