// All calls to the backend happen on the server (inside the frontend container),
// so the browser never needs to know where the backend lives.
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export type Info = { env: string; version: string; visits: number };
export type Entry = { id: number; name: string; message: string; created_at: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

export const getInfo = () => get<Info>("/api/info");
export const getEntries = () => get<Entry[]>("/api/guestbook");
