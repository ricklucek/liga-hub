
export function apiBase() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
}
