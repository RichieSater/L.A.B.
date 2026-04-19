import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import {
  canAccessLabModule,
  getVisibleLabModules,
  type LabModuleDefinition,
  type LabModuleId,
} from '../modules/module-registry';

const MODULE_META: Record<LabModuleId, { label: string; descriptor: string; accent: 'gold' | 'teal' | 'blue' | 'neutral' }> = {
  'golden-compass': {
    label: 'Ceremonial',
    descriptor: 'Annual recalibration and archive',
    accent: 'gold',
  },
  'quantum-planner': {
    label: 'Execution',
    descriptor: 'Week, calendar, focus, review',
    accent: 'teal',
  },
  'advisory-board': {
    label: 'Routing',
    descriptor: 'Domain pressure and next move',
    accent: 'blue',
  },
  'admin-dashboard': {
    label: 'Oversight',
    descriptor: 'Tier controls and account review',
    accent: 'neutral',
  },
  bonfire: {
    label: 'Bonfire',
    descriptor: 'Sealed',
    accent: 'neutral',
  },
  'morning-ship': {
    label: 'Morning Ship',
    descriptor: 'Sealed',
    accent: 'neutral',
  },
  scorecard: {
    label: 'Scorecard',
    descriptor: 'Sealed',
    accent: 'neutral',
  },
};

function resolveAccentClass(accent: 'gold' | 'teal' | 'blue' | 'neutral'): string {
  if (accent === 'gold') return 'lab-outline-gold';
  if (accent === 'teal') return 'lab-outline-teal';
  if (accent === 'blue') return 'lab-outline-blue';
  return 'lab-outline-neutral';
}

function resolveChipClass(accent: 'gold' | 'teal' | 'blue' | 'neutral'): string {
  if (accent === 'gold') return 'lab-chip lab-chip--gold';
  if (accent === 'teal') return 'lab-chip lab-chip--teal';
  if (accent === 'blue') return 'lab-chip lab-chip--blue';
  return 'lab-chip lab-chip--neutral';
}

function resolveOpenButtonClass(accent: 'gold' | 'teal' | 'blue' | 'neutral'): string {
  if (accent === 'gold') return 'lab-chip lab-chip--gold';
  if (accent === 'teal') return 'lab-chip lab-chip--teal';
  if (accent === 'blue') return 'lab-chip lab-chip--blue';
  return 'lab-chip lab-chip--neutral';
}

export function ModuleHubPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const modules = getVisibleLabModules(profile?.accountTier);
  const availableModules = modules.filter(module => module.availability === 'available');
  const liveModules = availableModules.filter(module => canAccessLabModule(profile?.accountTier, module));
  const lockedModules = availableModules.filter(module => !canAccessLabModule(profile?.accountTier, module));
  const sealedModules = modules.filter(module => module.availability !== 'available');

  return (
    <div className="lab-page flex min-h-[calc(100dvh-10rem)] items-center py-2 sm:py-6">
      <section className="lab-panel relative w-full overflow-hidden rounded-[2rem] px-4 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-9">
        <div className="mx-auto max-w-[82rem]">
          <div className="max-w-3xl">
            <h2 className="sr-only">The System</h2>
            <p aria-hidden="true" className="lab-eyebrow">The LAB Operating System</p>
            <h1 className="lab-display mt-5">Operational Dossiers</h1>
            <p className="lab-copy mt-5 max-w-[42rem]">
              Open only the live LAB surfaces. The module shelf stays premium, file-like, and clearly separated
              between active systems and sealed future modules.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="lab-chip lab-chip--gold-solid">
              {liveModules.length} Live Module{liveModules.length === 1 ? '' : 's'}
            </span>
            <span className="lab-chip lab-chip--neutral">
              {sealedModules.length} Sealed Module{sealedModules.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="lab-panel mt-6 rounded-[1.75rem] p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {liveModules.map(module => (
                <LiveModuleCard
                  key={module.id}
                  module={module}
                  onOpen={() => {
                    if (module.route) {
                      navigate(module.route);
                    }
                  }}
                />
              ))}
              {lockedModules.map(module => (
                <LockedModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>

          {sealedModules.length > 0 && (
            <div className="lab-panel lab-panel--strong mt-4 flex flex-wrap items-center gap-4 rounded-[1.5rem] px-5 py-4">
              {sealedModules.map(module => (
                <ComingSoonModuleButton key={module.id} module={module} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LiveModuleCard({
  module,
  onOpen,
}: {
  module: LabModuleDefinition;
  onOpen: () => void;
}) {
  const meta = MODULE_META[module.id];
  const summary = module.summary;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${module.label}`}
      className={`lab-panel lab-panel--soft flex min-h-[11.5rem] flex-col overflow-hidden rounded-[1.75rem] px-6 py-6 text-left transition duration-150 hover:-translate-y-[2px] hover:border-[rgba(228,209,174,0.2)] ${resolveAccentClass(meta.accent)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={resolveChipClass(meta.accent)}>{meta.label}</span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">
          Module
        </span>
      </div>

      <h2 className="mt-7 text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--lab-text)]">
        {module.label}
      </h2>
      <p className="mt-3 max-w-[34rem] text-[0.92rem] leading-6 text-[color:var(--lab-text-muted)]">
        {summary}
      </p>

      <div className="lab-rule mt-5" />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[0.82rem] font-semibold text-[color:var(--lab-text)]">
          {meta.descriptor}
        </p>
        <span className={resolveOpenButtonClass(meta.accent)}>Open</span>
      </div>
    </button>
  );
}

function LockedModuleCard({
  module,
}: {
  module: LabModuleDefinition;
}) {
  const meta = MODULE_META[module.id];

  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`${module.label} premium only`}
      className={`lab-panel lab-panel--soft flex min-h-[11.5rem] flex-col overflow-hidden rounded-[1.75rem] px-6 py-6 text-left opacity-85 ${resolveAccentClass(meta.accent)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="lab-chip lab-chip--neutral">Locked</span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">
          Premium
        </span>
      </div>

      <h2 className="mt-7 text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--lab-text)]">
        {module.label}
      </h2>
      <p className="mt-3 max-w-[34rem] text-[0.92rem] leading-6 text-[color:var(--lab-text-muted)]">
        {module.lockedSummary ?? module.summary}
      </p>

      <div className="lab-rule mt-5" />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[0.82rem] font-semibold text-[color:var(--lab-text)]">
          Premium only
        </p>
        <span className="lab-chip lab-chip--neutral">Locked</span>
      </div>
    </button>
  );
}

function ComingSoonModuleButton({
  module,
}: {
  module: LabModuleDefinition;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`${module.label} coming soon`}
      className="flex items-center gap-3"
    >
      <span className="lab-chip lab-chip--neutral">{module.label}</span>
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">
        Coming soon
      </span>
    </button>
  );
}
