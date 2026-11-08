import { Link } from "react-router-dom";

const STEPS = [
  { label: "Descriptive", path: "/descriptive", blurb: "What happened?" },
  { label: "Predictive", path: "/predictive", blurb: "What will happen?" },
  { label: "Prescriptive", path: "/prescriptive", blurb: "What should we do?" },
] as const;

export type StepName = (typeof STEPS)[number]["label"];

/** The Descriptive → Predictive → Prescriptive progress stepper for the analytics pages. */
export default function Stepper({ current }: { current: StepName }) {
  return (
    <nav aria-label="BA process progress" className="flex flex-wrap items-center gap-1">
      {STEPS.map((step, i) => {
        const active = step.label === current;
        return (
          <span key={step.label} className="flex items-center gap-1">
            {i > 0 && <span className="text-ink-500" aria-hidden="true">→</span>}
            <Link
              to={step.path}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                active
                  ? "bg-accent-600 text-white"
                  : "text-ink-500 hover:bg-surface-100 hover:text-ink-900"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  active ? "bg-white/25 text-white" : "bg-ink-900/10 text-ink-700"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              {step.label}
              <span className={`text-xs font-normal ${active ? "text-white/80" : "text-ink-500"}`}>
                {step.blurb}
              </span>
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
