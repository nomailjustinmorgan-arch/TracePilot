import { useState, type ReactNode } from 'react';
import { Activity, Menu, X, Plus, LayoutDashboard, FileSearch, HelpCircle } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Investigations', path: '/investigations', icon: FileSearch },
  { label: 'How It Works', path: '/how-it-works', icon: HelpCircle },
];

export function Layout({ children }: LayoutProps) {
  const { path } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (itemPath: string) => {
    if (itemPath === '/') return path === '/';
    return path.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-base-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 border border-accent-500/20">
              <Activity className="h-5 w-5 text-accent-400" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-slate-100 leading-tight">TracePilot</div>
              <div className="text-[10px] text-slate-500 leading-tight">Incident Investigation</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-base ${
                    active
                      ? 'bg-base-800 text-accent-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-base-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/incidents/new"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-base-950 hover:bg-accent-400 transition-base shadow-glow"
            >
              <Plus className="h-4 w-4" />
              New Investigation
            </Link>
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-base-800 transition-base cursor-pointer"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800/60 bg-base-950 animate-fade-in">
            <nav className="mx-auto max-w-7xl px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-base ${
                      active
                        ? 'bg-base-800 text-accent-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-base-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/incidents/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-accent-500 px-3 py-2.5 text-sm font-semibold text-base-950 hover:bg-accent-400 transition-base"
              >
                <Plus className="h-4 w-4" />
                New Investigation
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Phase 1 indicator */}
      <div className="border-b border-slate-800/40 bg-base-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-glow" />
            Phase 3 — Web Research + AI Investigation · Tavily Search & NVIDIA Nemotron via Nebius
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent-500/50" />
            <span>TracePilot — Incident Investigation Platform</span>
          </div>
          <div>Phase 3 · Tavily web research + AI investigation via Nebius Token Factory</div>
        </div>
      </footer>
    </div>
  );
}
