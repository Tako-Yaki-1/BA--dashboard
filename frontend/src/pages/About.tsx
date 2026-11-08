export default function About() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-900">About</h1>

      <section className="rounded-xl border border-accent-600/40 bg-accent-100/30 p-4" aria-label="Project profile">
        <h2 className="text-sm font-bold text-ink-900">BA Dashboard — Clack &amp; Co.</h2>
        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Course</dt>
            <dd>Business Analytics — BSIT 3B</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Instructor</dt>
            <dd>Almira M. Entrena</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Members</dt>
            <dd>John Niño P. Amba · Juvert N. Genabe · Danfred Ando</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label="Methodology">
        <h2 className="text-sm font-bold text-ink-900">Methodology</h2>
        <p className="mt-2 text-sm text-ink-700">
          The project follows the book's business analytics process on a sample problem for a new company,
          Clack &amp; Co.: background → data → descriptive → predictive → prescriptive → decision. Five related
          MySQL tables (customers, products, marketing campaigns, sales, transactions — 50+ records each) are
          seeded deterministically and read through a Laravel REST API: every chart, table, and number on the
          dashboard is fetched live, nothing is hardcoded. Descriptive analytics summarize what happened (KPIs,
          trends, correlations); predictive analytics fit a multiple linear regression — implemented from
          scratch in PHP with the normal equations — of weekly revenue on marketing spend and discount level;
          prescriptive analytics rank channels by return per peso and allocate the budget under share caps.
        </p>
        <p className="mt-2 text-sm text-ink-700">
          The frontend is React + Vite + TypeScript with Tailwind CSS and Recharts. Suggested task focus:
          John Niño P. Amba — database design, seeding, backend API; Juvert N. Genabe — analytics logic and
          Case Study content; Danfred Ando — frontend pages, dashboard charts, rating sheet. All three can
          present and explain the three BA steps. The real assignment is decided by the owners and editable
          on the Rating Sheet.
        </p>
      </section>
    </div>
  );
}
