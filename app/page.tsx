import Image from "next/image";
import Link from "next/link";
import { EntryForm } from "@/components/entry-form";

export default function Home() {
  return (
    <main className="entry-page">
      <section className="brand-stage" aria-label="NERA WHOOP Challenge">
        <Image
          className="brand-art"
          src="/nera-whoop-brand.png"
          alt="WHOOP Challenge, NERA Wellbeing Week — Stronger together, healthier together"
          fill
          priority
          sizes="(max-width: 850px) 100vw, 54vw"
        />
        <div className="brand-shade" />
        <div className="brand-caption">
          <span className="live-pill"><span className="live-dot" /> Challenge live</span>
          <p>Bring the energy. Set your score. Own your moment.</p>
        </div>
      </section>

      <section className="form-stage">
        <div className="form-stage-inner">
          <div className="form-intro">
            <span className="eyebrow">Wellbeing Week · Mini Event</span>
            <h1>Ready to <em>whoop</em> it?</h1>
            <p>Enter your details and we&apos;ll add you to the challenge board.</p>
          </div>
          <EntryForm />
          <footer className="entry-footer">
            <span>Stronger together. Healthier together.</span>
            <Link href="/admin">Staff access</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
