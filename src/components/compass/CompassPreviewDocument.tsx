import { useMemo } from 'react';
import type { CompassPreviewConfig, CompassSessionDetail } from '../../types/compass';
import {
  buildCompassPreview,
  type CompassPreviewField,
} from '../../lib/compass-preview';

function formatSessionDate(value: string | null): string {
  if (!value) {
    return 'Not completed yet';
  }

  return new Date(value).toLocaleDateString();
}

function getSectionEntriesGridClassName(entryCount: number): string {
  return [
    'mt-6 grid gap-4',
    entryCount > 1 ? 'xl:grid-cols-2' : null,
  ]
    .filter(Boolean)
    .join(' ');
}

function getGroupedListGridClassName(groupCount: number): string {
  return [
    'grid gap-3',
    groupCount > 1 ? 'md:grid-cols-2' : null,
    groupCount > 2 ? 'xl:grid-cols-3' : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function CompassPreviewDocument({
  session,
  config,
  showDocumentIntro = true,
}: {
  session: CompassSessionDetail;
  config: CompassPreviewConfig;
  showDocumentIntro?: boolean;
}) {
  const preview = useMemo(() => buildCompassPreview(session, config), [config, session]);

  return (
    <div className="compass-print-document space-y-8">
      {showDocumentIntro ? (
        <section className="compass-print-section lab-panel rounded-[2rem] border-[rgba(228,209,174,0.22)] bg-[radial-gradient(circle_at_top,_rgba(228,209,174,0.12),_rgba(19,28,38,0.96)_58%)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">{config.title}</p>
          <h1 className="lab-title mt-2 text-3xl">{session.title}</h1>
          {config.description ? (
            <p className="lab-copy mt-3 max-w-3xl text-sm">{config.description}</p>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetaCard label="Planning year" value={String(session.planningYear)} />
            <MetaCard label="Status" value={session.status === 'completed' ? 'Completed' : 'In progress'} />
            <MetaCard
              label={session.status === 'completed' ? 'Completed' : 'Last updated'}
              value={formatSessionDate(session.status === 'completed' ? session.completedAt : session.updatedAt)}
            />
          </div>
        </section>
      ) : null}

      {preview.sections.length > 0 ? (
        preview.sections.map(section => (
          <section
            key={section.key}
            className={`compass-print-section rounded-[2rem] border p-6 ${
              section.emphasized
                ? 'border-[rgba(228,209,174,0.3)] bg-[rgba(228,209,174,0.08)]'
                : 'lab-panel lab-panel--soft'
            }`}
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--lab-text-dim)]">{section.title}</p>
              <h2 className="lab-title text-2xl">{section.subtitle}</h2>
            </div>
            <div className={getSectionEntriesGridClassName(section.entries.length)}>
              {section.entries.map(entry => (
                <article
                  key={entry.screenId}
                  className="lab-subpanel p-5"
                >
                  {entry.title ? (
                    <h3 className="text-lg font-semibold text-[color:var(--lab-text)]">{entry.title}</h3>
                  ) : null}
                  <div className={`space-y-4 ${entry.title ? 'mt-4' : ''}`}>
                    {entry.fields.map((field, index) => (
                      <PreviewFieldView key={`${entry.screenId}-${field.label}-${index}`} field={field} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <section className="lab-empty-state rounded-[2rem] p-8 text-center">
          <h2 className="text-xl font-semibold text-[color:var(--lab-text)]">Nothing to preview yet</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--lab-text-muted)]">
            This view will fill in automatically as Compass answers are captured.
          </p>
        </section>
      )}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="lab-subpanel px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-dim)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--lab-text)]">{value}</p>
    </div>
  );
}

function PreviewFieldView({ field }: { field: CompassPreviewField }) {
  if (field.kind === 'text') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-dim)]">{field.label}</p>
        <p className="whitespace-pre-line text-sm leading-7 text-[color:var(--lab-text)]">{field.value}</p>
      </div>
    );
  }

  if (field.kind === 'list') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-dim)]">{field.label}</p>
        <ul className="space-y-2 text-sm leading-7 text-[color:var(--lab-text)]">
          {field.items.map(item => (
            <li key={item} className="list-disc ml-5">
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (field.kind === 'pairs') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-dim)]">{field.label}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {field.entries.map(entry => (
            <div key={`${field.label}-${entry.label}`} className="lab-subpanel lab-subpanel--soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-dim)]">{entry.label}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--lab-text)]">{entry.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-dim)]">{field.label}</p>
      <div className={getGroupedListGridClassName(field.groups.length)}>
        {field.groups.map(group => (
          <div key={group.label} className="lab-subpanel lab-subpanel--soft px-4 py-4">
            <p className="text-sm font-semibold text-[color:var(--lab-text)]">{group.label}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--lab-text)]">
              {group.items.map(item => (
                <li key={`${group.label}-${item}`} className="list-disc ml-5">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
