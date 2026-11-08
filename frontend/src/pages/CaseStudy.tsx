import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import { describeError } from "../lib/apiErrors";
import { getMetaCounts, getProcessSummary } from "../api/analytics";
import type { CountsResponse, ProcessSummaryResponse, StageName } from "../types";

const STAGE_CARDS: Array<{
  stage: StageName;
  title: string;
  question: string;
  path: string;
}> = [
  { stage: "descriptive", title: "Descriptive", question: "What happened?", path: "/descriptive" },
  { stage: "predictive", title: "Predictive", question: "What will happen?", path: "/predictive" },
  { stage: "prescriptive", title: "Prescriptive", question: "What should we do?", path: "/prescriptive" },
];

export default function CaseStudy() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProcessSummaryResponse | null>(null);
  const [counts, setCounts] = useState<CountsResponse | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getProcessSummary(), getMetaCounts()])
      .then(([s, c]) => {
        setSummary(s);
        setCounts(c);
        setLoading(false);
      })
      .catch((err) => {
        setError(describeError(err).message);
        setLoading(false);
      });
  };

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink-900">Case Study and BA Process</h1>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
          <p className="text-sm text-ink-500">Gathering findings…</p>
        </div>
      ) : (
        <>
          {/* 8.1 capstone overview */}
          <section className="rounded-xl border border-accent-600/40 bg-accent-100/30 p-4" aria-label="Company profile">
            <h2 className="text-sm font-bold text-ink-900">Clack &amp; Co. — a niche mechanical-keyboard shop</h2>
            <p className="mt-2 text-sm text-ink-700">
              Clack &amp; Co. is a new online shop in the Philippines selling custom mechanical keyboards,
              switches, keycap sets, deskmats and mod parts to students, gamers, office workers and hobbyists
              — through its online page and pop-up booths.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              <strong>The problem (mirrors the book's sample case):</strong> finding the best advertising
              strategy. The shop spreads a weekly marketing budget across four channels but does not know
              which channels actually bring in sales, how much revenue to expect for a given spend and
              discount, or how to split next month's budget.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              <strong>The decision to be made:</strong> how should Clack &amp; Co. divide its marketing
              budget across Facebook and Instagram Ads, TikTok Creator Collabs, Discord and gaming-community
              sponsorships, and campus pop-up booths to earn the highest revenue?
            </p>
            <p className="mt-2 text-xs text-ink-500">
              Structure follows the book's sample case (page 156): background → data → descriptive →
              predictive → prescriptive → decision.
            </p>
          </section>

          {/* the data used — record counts pulled from the API */}
          <section className="rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label="Data used">
            <h2 className="text-sm font-bold text-ink-900">The data used</h2>
            <p className="mt-1 text-xs text-ink-500">Record counts pulled live from the API (<code>/api/meta/counts</code>).</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                ["Customers", counts?.customers],
                ["Products", counts?.products],
                ["Campaign weeks", counts?.campaigns],
                ["Sales", counts?.sales],
                ["Transactions", counts?.transactions],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-surface-100/70 px-3 py-2 text-center">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                  <dd className="text-lg font-bold text-ink-900">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 8.2 BA Process: the graded connected flow */}
          <section className="flex flex-col gap-3" aria-label="BA Process">
            <h2 className="text-sm font-bold text-ink-900">The three BA steps — connected</h2>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
              {STAGE_CARDS.map((card, i) => (
                <div key={card.stage} className="min-w-0 flex-1 contents lg:flex lg:items-stretch">
                  <Link
                    to={card.path}
                    className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-ink-900/10 bg-surface-50 p-4 transition hover:border-accent-600/60 hover:shadow-sm"
                    aria-label={`${card.title} step — open the ${card.title.toLowerCase()} page`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-accent-600 px-2 py-0.5 text-xs font-bold text-white">
                        Step {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-ink-500">{card.question}</span>
                    </div>
                    <h3 className="text-base font-bold text-ink-900">{card.title}</h3>
                    <p className="text-sm text-ink-700" aria-label={`${card.title} key finding`}>
                      {summary?.stages[card.stage]?.finding ?? "—"}
                    </p>
                    <span className="mt-auto text-xs font-semibold text-accent-700">Open {card.title.toLowerCase()} page →</span>
                  </Link>
                  {i < STAGE_CARDS.length - 1 && summary && (
                    <div className="flex items-center justify-center lg:flex-col lg:justify-center" aria-hidden="false">
                      <span className="mx-1 rounded-full bg-accent-600 px-2 py-1 text-center text-[10px] font-bold text-white lg:mx-0 lg:my-1 lg:-rotate-0">
                        →
                      </span>
                      <span className="px-1 text-center text-[10px] font-semibold text-ink-500 lg:max-w-[9rem] lg:px-0">
                        hands {summary.stages[card.stage].hands_to_next}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-500">
              Each card's finding is generated from the data by <code>/api/analytics/process-summary</code>;
              arrows show what each step hands to the next, leading to the decision: the recommended budget split.
            </p>
          </section>

          {/* D/P/P short descriptions */}
          <section className="rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label="The three BA steps in short">
            <h2 className="text-sm font-bold text-ink-900">The three steps in short</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-700">
              <li><strong>Descriptive — what happened?</strong> KPIs, weekly trends, channel comparison, top products, customer breakdown, correlations.</li>
              <li><strong>Predictive — what will happen?</strong> A regression model of revenue on spend and discount, actual vs predicted, a 4-week forecast, and a prediction tool.</li>
              <li><strong>Prescriptive — what should we do?</strong> Channel ROI ranking, a recommended budget split under share caps, a what-if simulator, and recommendations.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
