import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

const MEMBERS = ["John Niño P. Amba", "Juvert N. Genabe", "Danfred Ando"] as const;

const DEFAULTS = {
  groupNo: "",
  title: "BA Dashboard — Clack & Co.",
  leader: MEMBERS[0],
  overview:
    "Clack & Co. is an online shop selling custom mechanical keyboards, switches, keycap sets, " +
    "deskmats and mod parts. Identified problem: finding the best advertising strategy — the shop " +
    "spends a weekly budget across four marketing channels but does not know which channels bring " +
    "in sales or how to split next month's budget. Decision to be made: the channel budget split " +
    "with the highest expected revenue.",
  parts: [
    "Database design, seeding, backend API",
    "Analytics logic (descriptive, predictive, prescriptive) and Case Study",
    "Frontend pages, dashboard charts, Rating Sheet",
  ] as string[],
};

/** A useState that persists to localStorage so edits survive a refresh. */
function useSaved<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => (localStorage.getItem(key) as T) ?? initial);
  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);
  return [value, setValue];
}

export default function RatingSheet() {
  const [groupNo, setGroupNo] = useSaved("rating.groupNo", DEFAULTS.groupNo);
  const [title, setTitle] = useSaved("rating.title", DEFAULTS.title);
  const [leader, setLeader] = useSaved<string>("rating.leader", DEFAULTS.leader);
  const [overview, setOverview] = useSaved("rating.overview", DEFAULTS.overview);
  const [parts, setParts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("rating.parts");
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length === 3 ? (parsed as string[]) : DEFAULTS.parts;
    } catch {
      return DEFAULTS.parts;
    }
  });

  useEffect(() => {
    localStorage.setItem("rating.parts", JSON.stringify(parts));
  }, [parts]);

  const printHere = () => window.print();

  const field =
    "w-full rounded-lg border border-ink-900/20 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100 print:rounded-none print:border-ink-900 print:bg-white print:ring-0 print:resize-none";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-ink-900">Rating Sheet</h1>
        <button
          onClick={printHere}
          className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print / Save as PDF
        </button>
      </div>

      <div className="rating-sheet mx-auto w-full max-w-[900px] rounded-xl border border-ink-900/10 bg-white p-8 text-ink-900 print:max-w-none print:rounded-none print:border-0 print:p-0" aria-label="Rating sheet">
        <h2 className="text-center text-lg font-bold uppercase tracking-wide">Group Rating Sheet</h2>
        <p className="mt-1 text-center text-xs text-ink-500 print:text-ink-900">
          Business Analytics — Final Project
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 print:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Group No.:</span>
            <input value={groupNo} onChange={(e) => setGroupNo(e.target.value)} placeholder="(none assigned)" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Title of Project:</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Group leader (reports the task assignment):</span>
            <select value={leader} onChange={(e) => setLeader(e.target.value)} className={field}>
              {MEMBERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-semibold">Overview of the company and its identified problem:</span>
          <textarea rows={4} value={overview} onChange={(e) => setOverview(e.target.value)} className={field} />
        </div>

        <table className="mt-6 w-full border-collapse text-sm print:text-[12px]">
          <thead>
            <tr>
              {["Name of Member", "Part assigned", "Quality of output", "BA Process shown", "Total"].map((h, i) => (
                <th
                  key={h}
                  className={`border border-ink-900 px-2 py-1.5 text-center font-bold print:px-1 ${
                    i === 2 || i === 3 || i === 4 ? "w-[15%]" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((member, mi) => {
              const isLeader = member === leader;
              return (
                <tr key={member}>
                  <td className="border border-ink-900 px-2 py-2 print:px-1 print:py-3">
                    {member}
                    {isLeader && <span className="ml-2 rounded bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold text-white print:px-1">Leader</span>}
                  </td>
                  <td className="border border-ink-900 p-0 align-top">
                    <textarea
                      rows={2}
                      value={parts[mi]}
                      onChange={(e) => setParts((p) => p.map((v, i) => (i === mi ? e.target.value : v)))}
                      className={`resize-none px-2 py-1 print:px-1 print:py-1 ${field}`}
                      aria-label={`Part assigned to ${member}`}
                    />
                  </td>
                  <td className="border border-ink-900" aria-label="Quality of output score (instructor fills in)" />
                  <td className="border border-ink-900" aria-label="BA Process shown score (instructor fills in)" />
                  <td className="border border-ink-900" aria-label="Total score (instructor fills in)" />
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 flex items-end justify-between gap-6 text-sm">
          <p>
            <span className="font-semibold">Submitted to:</span> ALMIRA M. ENTRENA
          </p>
          <p className="min-w-[220px]">
            <span className="font-semibold">Final Rating:</span>
            <span className="ml-1 inline-block w-40 border-b border-ink-900 align-bottom" aria-label="Final rating (instructor fills in)" />
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-500 print:hidden">
        Edits persist in this browser (localStorage) and show exactly like this when you Print or Save as PDF —
        the app sidebar, header, and this hint line are hidden on paper. Suggested parts can be edited by the leader.
      </p>
    </div>
  );
}
