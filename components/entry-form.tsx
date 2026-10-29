"use client";

import { FormEvent, useState } from "react";

type Gender = "female" | "male" | "other";

const genderOptions: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

type SubmittedEntry = { name: string; score: number };
type ScoreInputs = [string, string, string, string];

const emptyScores: ScoreInputs = ["", "", "", ""];

export function EntryForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [scores, setScores] = useState<ScoreInputs>(emptyScores);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<SubmittedEntry | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const numericScores = scores.map(Number);
    if (!name.trim() || !gender || scores.some((score) => !score.trim()) || numericScores.some((score) => !Number.isFinite(score) || score < 0 || score > 999999)) {
      setError("Please complete all fields with four valid scores.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gender, scores: numericScores }),
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
    setScores(["", "", "", ""]);
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
        <p>Your four-day average is now on the board.</p>
        <div className="score-ticket">
          <span>Average score</span><strong>{submitted.score.toLocaleString()}</strong><small>PTS</small>
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
      <fieldset className="field-group score-field">
        <legend>Daily scores</legend>
        <div className="score-grid">
          {scores.map((score, index) => (
            <label className="day-score-field" key={index} htmlFor={`participant-score-${index + 1}`}>
              <span>Day {index + 1}</span>
              <div className="score-input-wrap">
                <input
                  id={`participant-score-${index + 1}`}
                  name={`score-${index + 1}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={999999}
                  step="any"
                  placeholder="000.00"
                  value={score}
                  onChange={(event) => setScores((current) => current.map((value, scoreIndex) => scoreIndex === index ? event.target.value : value) as ScoreInputs)}
                  required
                />
                <span>PTS</span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="submit-button" type="submit" disabled={status === "submitting"}>
        <span>{status === "submitting" ? "Saving score…" : "Submit my score"}</span><span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
