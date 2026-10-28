"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Gender = "female" | "male" | "other";
type Entry = { id: number; name: string; gender: Gender; score: number; createdAt: string };
type ViewState = "loading" | "locked" | "ready";

const genderLabel: Record<Gender, string> = { female: "Female", male: "Male", other: "Other" };
const submittedAtFormatter = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

async function fetchEntriesData() {
  const response = await fetch("/api/entries", { cache: "no-store" });
  if (response.status === 401) return { status: "locked" as const, entries: [] };
  const payload = (await response.json()) as { entries?: Entry[]; error?: string };
  if (!response.ok) throw new Error(payload.error || "Could not load entries.");
  return { status: "ready" as const, entries: payload.entries || [] };
}

export function AdminApp() {
  const [view, setView] = useState<ViewState>("loading");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<Gender | "all">("all");
  const [sort, setSort] = useState<"highest" | "newest">("highest");
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadEntries = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const result = await fetchEntriesData();
      if (result.status === "locked") {
        setView("locked");
        return;
      }
      setEntries(result.entries);
      setView("ready");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Could not load entries.");
      setView("locked");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchEntriesData()
      .then((result) => {
        if (!active) return;
        if (result.status === "locked") {
          setView("locked");
          return;
        }
        setEntries(result.entries);
        setView("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoginError(error instanceof Error ? error.message : "Could not load entries.");
        setView("locked");
      });
    return () => { active = false; };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLoginError(payload.error || "Unable to sign in.");
        return;
      }
      setCode("");
      await loadEntries();
    } catch {
      setLoginError("Unable to reach the dashboard. Please try again.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setEntries([]);
    setView("locked");
  }

  async function handleDelete(entry: Entry) {
    if (!window.confirm(`Remove ${entry.name}'s score from the challenge board?`)) return;
    setDeletingId(entry.id);
    try {
      const response = await fetch(`/api/entries?id=${entry.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not remove this entry.");
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not remove this entry.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return entries
      .filter((entry) => gender === "all" || entry.gender === gender)
      .filter((entry) => !query || entry.name.toLocaleLowerCase().includes(query))
      .sort((left, right) => sort === "highest" ? right.score - left.score || right.id - left.id : right.id - left.id);
  }, [entries, gender, search, sort]);

  const topScore = entries.reduce((highest, entry) => Math.max(highest, entry.score), 0);
  const femaleCount = entries.filter((entry) => entry.gender === "female").length;
  const maleCount = entries.filter((entry) => entry.gender === "male").length;

  if (view === "loading") {
    return <main className="admin-loading"><span className="admin-loader" /><p>Opening challenge control…</p></main>;
  }

  if (view === "locked") {
    return (
      <main className="admin-login-page">
        <div className="admin-login-brand">
          <Link href="/">← Back to challenge</Link>
          <div>
            <span className="eyebrow light">NERA · Wellbeing Week</span>
            <h1>Challenge<br /><em>control.</em></h1>
            <p>Scores, rankings and participant insights—all in one place.</p>
          </div>
          <span className="secure-note">● Secure staff area</span>
        </div>
        <section className="admin-login-panel">
          <form className="admin-login-card" onSubmit={handleLogin}>
            <div className="lock-icon" aria-hidden="true">↗</div>
            <span className="eyebrow">Admin dashboard</span>
            <h2>Welcome back</h2>
            <p>Enter the event admin code to continue.</p>
            <label htmlFor="admin-code">Admin code</label>
            <input id="admin-code" type="password" autoComplete="current-password" placeholder="Enter code" value={code} onChange={(event) => setCode(event.target.value)} required autoFocus />
            {loginError ? <p className="form-error" role="alert">{loginError}</p> : null}
            <button className="submit-button" type="submit"><span>Unlock dashboard</span><span aria-hidden="true">→</span></button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="mini-mark">N</span>
          <div><strong>WHOOP Challenge</strong><small>Admin control</small></div>
        </div>
        <div className="dashboard-actions"><Link href="/">View entry form</Link><button type="button" onClick={handleLogout}>Log out</button></div>
      </header>

      <div className="dashboard-shell">
        <section className="dashboard-title-row">
          <div><span className="eyebrow">Live event overview</span><h1>Challenge board</h1><p>Every participant and score, updated on demand.</p></div>
          <button className="refresh-button" type="button" onClick={() => void loadEntries(true)} disabled={refreshing}><span className={refreshing ? "spinning" : ""}>↻</span>{refreshing ? "Refreshing…" : "Refresh entries"}</button>
        </section>

        <section className="stats-grid" aria-label="Challenge statistics">
          <article className="stat-card featured"><span>Total participants</span><strong>{entries.length}</strong><small>Let&apos;s keep moving</small></article>
          <article className="stat-card"><span>Top score</span><strong>{topScore.toLocaleString()}</strong><small>Current event best</small></article>
          <article className="stat-card"><span>Female</span><strong>{femaleCount}</strong><small>{entries.length ? Math.round((femaleCount / entries.length) * 100) : 0}% of entries</small></article>
          <article className="stat-card"><span>Male</span><strong>{maleCount}</strong><small>{entries.length ? Math.round((maleCount / entries.length) * 100) : 0}% of entries</small></article>
        </section>

        <section className="board-card">
          <div className="board-toolbar">
            <div className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search participant names" placeholder="Search by name…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <div className="toolbar-selects">
              <select aria-label="Filter by gender" value={gender} onChange={(event) => setGender(event.target.value as Gender | "all")}>
                <option value="all">All genders</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
              <select aria-label="Sort entries" value={sort} onChange={(event) => setSort(event.target.value as "highest" | "newest")}>
                <option value="highest">Highest score first</option><option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          <div className="table-summary"><strong>{filteredEntries.length}</strong> {filteredEntries.length === 1 ? "entry" : "entries"}</div>
          <div className="entries-table-wrap">
            <table className="entries-table">
              <thead><tr><th>Rank</th><th>Participant</th><th>Gender</th><th>Score</th><th>Submitted</th><th>Action</th></tr></thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td><span className={`rank rank-${index + 1}`}>{index + 1}</span></td>
                    <td><div className="participant-cell"><span>{entry.name.slice(0, 1).toUpperCase()}</span><strong>{entry.name}</strong></div></td>
                    <td><span className={`gender-badge ${entry.gender}`}>{genderLabel[entry.gender]}</span></td>
                    <td><strong className="table-score">{entry.score.toLocaleString()}</strong></td>
                    <td>{formatSubmittedAt(entry.createdAt)}</td>
                    <td><button className="delete-entry-button" type="button" onClick={() => void handleDelete(entry)} disabled={deletingId === entry.id}>{deletingId === entry.id ? "Removing…" : "Remove"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredEntries.length ? <div className="empty-board"><span>◎</span><h3>No entries found</h3><p>Try changing the filters or submit the first score.</p></div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatSubmittedAt(value: string) {
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  return submittedAtFormatter.format(date);
}
