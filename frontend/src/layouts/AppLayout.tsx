import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Database,
  Info,
  LayoutDashboard,
  Menu,
  TrendingUp,
  Target,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api/client";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, phase: "4" },
  { to: "/case-study", label: "Case Study", icon: BookOpen, phase: "6" },
  { to: "/descriptive", label: "Descriptive", icon: BarChart3, phase: "4" },
  { to: "/predictive", label: "Predictive", icon: TrendingUp, phase: "5" },
  { to: "/prescriptive", label: "Prescriptive", icon: Target, phase: "6" },
  { to: "/data", label: "Data Manager", icon: Database, phase: "3" },
  { to: "/rating-sheet", label: "Rating Sheet", icon: ClipboardList, phase: "7" },
  { to: "/about", label: "About", icon: Info, phase: "7" },
];

/** Fetches /health once so the shell proves the API + CORS connection works. */
function ApiStatus() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");

  useEffect(() => {
    api
      .get("/health")
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));
  }, []);

  const dot =
    status === "online" ? "bg-positive-600" : status === "offline" ? "bg-negative-600" : "bg-ink-500";

  return (
    <span className="flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-sm font-medium text-ink-700">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      API {status}
    </span>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const page = links.find((l) => l.to === pathname);
  const title = page ? page.label : "BA Dashboard";

  return (
    <div className="flex min-h-screen bg-surface-100 text-ink-900">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed z-40 flex min-h-screen w-60 flex-col bg-ink-900 text-white transition-transform duration-200 md:static md:translate-x-0 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-lg font-bold leading-tight">Clack &amp; Co.</p>
            <p className="text-xs text-surface-100/60">BA Dashboard</p>
          </div>
          <button
            className="md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-600 text-white"
                    : "text-surface-100/80 hover:bg-ink-700 hover:text-white"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-xs text-surface-100/50">BSIT 3B — Business Analytics</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-ink-900/10 bg-surface-50 px-4 py-3 md:px-8 print:hidden">
          <button
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-lg font-bold text-ink-900 md:text-xl">{title}</h1>
          <ApiStatus />
        </header>
        <main className="flex-1 p-4 md:p-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
