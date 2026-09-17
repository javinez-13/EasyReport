const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  if (path.startsWith("/uploads/")) return `${API_URL}${path}`;
  if (path.startsWith("/")) return path;
  return `${API_URL}/uploads/${path.replace(/^\/+/, "")}`;
}

export { API_URL };
