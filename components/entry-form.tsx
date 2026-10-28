"use client";

import { FormEvent, useState } from "react";

type Gender = "female" | "male" | "other";

const genderOptions: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

type SubmittedEntry = { name: string; score: number };

export function EntryForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [score, setScore] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<SubmittedEntry | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const numericScore = Number(score);
    if (!name.trim() || !gender || !Number.isInteger(numericScore)) {
      setError("Please complete all three fields.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gender, score: numericScore }),
      });
      const payload = (await response.json()) as { entry?: SubmittedEntry; error?: string };
      if (!response.ok || !payload.entry) throw new Error(payload.error || "We couldn’t save that score.");
      setSubmitted(payload.entry);
      setStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We couldn’t save that score. Please try again.");
      setStatus("idle");
    }
  }

  function resetForm() {
    setName("");
    setGender("");
    setScore("");
    setSubmitted(null);
    setError("");
    setStatus("idle");
  }

  if (status === "success" && submitted) {
    return (
      <section className="success-card" aria-live="polite">
        <div className="success-burst" aria-hidden="true"><span>✓</span></div>
        <span className="eyebrow">Score locked in</span>
        <h2>Nice work, {submitted.name}!</h2>
        <p>Your challenge score is now on the board.</p>
        <div className="score-ticket">
          <span>Your score</span><strong>{submitted.score.toLocaleString()}</strong><small>PTS</small>
        </div>
        <button className="secondary-button" type="button" onClick={resetForm}>Add another participant</button>
      </section>
    );
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit} noValidate>
      <div className="field-group">
        <label htmlFor="participant-name">Name</label>
        <input id="participant-name" name="name" type="text" autoComplete="name" maxLength={80} placeholder="Enter participant name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <fieldset className="field-group gender-field">
        <legend>Gender</legend>
        <div className="choice-row">
          {genderOptions.map((option) => (
            <label className={`choice-chip ${gender === option.value ? "selected" : ""}`} key={option.value}>
              <input type="radio" name="gender" value={option.value} checked={gender === option.value} onChange={() => setGender(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field-group">
        <label htmlFor="participant-score">Score</label>
        <div className="score-input-wrap">
          <input id="participant-score" name="score" type="number" inputMode="numeric" min={0} max={999999} step={1} placeholder="000" value={score} onChange={(event) => setScore(event.target.value)} required />
          <span>PTS</span>
        </div>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="submit-button" type="submit" disabled={status === "submitting"}>
        <span>{status === "submitting" ? "Saving score…" : "Submit my score"}</span><span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
