import { getEntries, getInfo, type Entry, type Info } from "@/lib/backend";
import { GuestbookForm } from "./guestbook-form";

// Render on every request (on the server), never at build time.
export const dynamic = "force-dynamic";

const TITLE = "Welcome to DevOps 101"; // 👈 change me live in the PR demo

async function loadData(): Promise<{ info: Info; entries: Entry[] } | null> {
  try {
    const [info, entries] = await Promise.all([getInfo(), getEntries()]);
    return { info, entries };
  } catch {
    return null; // backend (or its DB/Redis) is down: show a friendly message instead
  }
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

export default async function Home() {
  // Read at request time, so the SAME image can run as local, staging or production.
  const env = process.env.APP_ENV ?? "local";
  const version = (process.env.APP_VERSION ?? "dev").slice(0, 7);
  const data = await loadData();

  return (
    <main className="container">
      <header className="topbar">
        <span className={`badge badge-${env}`}>{env}</span>
        <code className="version">version {version}</code>
      </header>

      <h1 className="title">{TITLE}</h1>
      <p className="subtitle">Next.js → FastAPI → Postgres + Redis, shipped with Docker &amp; GitHub Actions</p>

      {data ? (
        <div className="grid">
          <section className="card visits">
            <h2>Page visits</h2>
            <p className="big-number">{data.info.visits.toLocaleString("en")}</p>
            <p className="muted">counted in Redis</p>
          </section>

          <section className="card">
            <h2>Guestbook</h2>
            <GuestbookForm />
            {data.entries.length === 0 ? (
              <p className="muted">No entries yet. Be the first to sign!</p>
            ) : (
              <ul className="entries">
                {data.entries.map((entry) => (
                  <li key={entry.id}>
                    <div className="entry-head">
                      <strong>{entry.name}</strong>
                      <span className="muted">{timeAgo(entry.created_at)}</span>
                    </div>
                    <p>{entry.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <section className="card unreachable">
          <h2>Backend unreachable</h2>
          <p>
            The frontend is up, but it can&apos;t reach the API. Is the backend container running?
          </p>
          <code>docker compose ps</code>
        </section>
      )}
    </main>
  );
}
