import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import {
  canAccessLabModule,
  getVisibleLabModules,
  type LabModuleDefinition,
  type LabModuleTone,
} from '../modules/module-registry';

const DOT_GRID_STYLE: CSSProperties = {
  backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

const MODULE_TONE_STYLES: Record<LabModuleTone, {
  border: string;
  glow: string;
  pill: string;
  text: string;
}> = {
  gold: {
    border: 'border-amber-300/25 hover:border-amber-200/50',
    glow: 'from-amber-400/18 via-amber-200/8 to-transparent',
    pill: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
    text: 'text-amber-200',
  },
  sky: {
    border: 'border-sky-300/20 hover:border-sky-200/45',
    glow: 'from-sky-400/18 via-sky-200/8 to-transparent',
    pill: 'border-sky-300/30 bg-sky-500/10 text-sky-100',
    text: 'text-sky-200',
  },
  emerald: {
    border: 'border-emerald-300/20 hover:border-emerald-200/45',
    glow: 'from-emerald-400/18 via-emerald-200/8 to-transparent',
    pill: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
    text: 'text-emerald-200',
  },
  ember: {
    border: 'border-orange-300/12',
    glow: 'from-orange-400/10 via-orange-200/4 to-transparent',
    pill: 'border-orange-300/20 bg-orange-500/8 text-orange-100/85',
    text: 'text-orange-100/80',
  },
  rose: {
    border: 'border-rose-300/12',
    glow: 'from-rose-400/10 via-rose-200/4 to-transparent',
    pill: 'border-rose-300/20 bg-rose-500/8 text-rose-100/85',
    text: 'text-rose-100/80',
  },
  slate: {
    border: 'border-slate-300/12',
    glow: 'from-slate-300/10 via-slate-200/4 to-transparent',
    pill: 'border-slate-300/20 bg-slate-500/8 text-slate-100/85',
    text: 'text-slate-100/80',
  },
};

export function ModuleHubPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const modules = getVisibleLabModules(profile?.accountTier);
  const liveModuleCount = modules.filter(module => module.availability === 'available').length;
  const comingSoonCount = modules.length - liveModuleCount;
  const freeTier = profile?.accountTier === 'free';

  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] items-center py-4 sm:py-8">
      <section className="relative isolate w-full overflow-hidden rounded-[2.5rem] border border-stone-800/80 bg-[linear-gradient(180deg,_rgba(12,16,24,0.98)_0%,_rgba(20,24,34,0.98)_35%,_rgba(10,12,18,1)_100%)] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:px-10 sm:py-10 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={DOT_GRID_STYLE} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-400">
              The L.A.B. operating system
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              The System
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
              {freeTier
                ? 'Golden Compass is open now. Premium unlocks Advisory Board and Quantum Planner so the full LAB operating system comes online around it.'
                : 'Choose the module you want to enter. Quantum Planner runs the week, Advisory Board keeps domain pressure visible, and Golden Compass recalibrates the year behind it all.'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-emerald-100">
              {liveModuleCount} live modules
            </span>
            <span className="rounded-full border border-stone-700 bg-stone-900/80 px-4 py-2 text-stone-300">
              {comingSoonCount} coming online next
            </span>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                onOpen={() => {
                  if (module.route) {
                    navigate(module.route);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({
  module,
  onOpen,
}: {
  module: LabModuleDefinition;
  onOpen: () => void;
}) {
  const tone = MODULE_TONE_STYLES[module.tone];
  const { profile } = useAuth();
  const hasAccess = canAccessLabModule(profile?.accountTier, module);
  const isAvailable = module.availability === 'available' && hasAccess;
  const isLocked = module.availability === 'available' && !hasAccess;
  const ariaLabel = isAvailable
    ? `Open ${module.label}`
    : isLocked
      ? `${module.label} premium only`
      : `${module.label} coming soon`;
  const summary = isLocked && module.lockedSummary
    ? module.lockedSummary
    : module.summary;

  return (
    <button
      type="button"
      aria-disabled={!isAvailable}
      aria-label={ariaLabel}
      onClick={() => {
        if (isAvailable) {
          onOpen();
        }
      }}
      className={`group relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,_rgba(19,24,35,0.94)_0%,_rgba(10,12,18,0.98)_100%)] p-6 text-left shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 ${
        isAvailable
          ? `${tone.border} hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.35)]`
          : `${tone.border} cursor-default`
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-80`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${tone.pill}`}>
            {isAvailable ? 'Available now' : isLocked ? 'Premium only' : 'Coming soon'}
          </span>
          <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${tone.text}`}>
            Module
          </span>
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
          {module.label}
        </h2>
        <p className="mt-4 max-w-xs text-sm leading-6 text-stone-300">
          {summary}
        </p>
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-white/8 pt-5">
        <span className="text-sm font-semibold text-stone-200">
          {isAvailable ? 'Enter module' : isLocked ? 'Upgrade required' : 'Awaiting wiring'}
        </span>
        <span className={`text-sm font-semibold uppercase tracking-[0.18em] ${isAvailable ? 'text-white' : 'text-stone-500'}`}>
          {isAvailable ? 'Open' : isLocked ? 'Locked' : 'Soon'}
        </span>
      </div>
    </button>
  );
}
