import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../../constants/routes';
import { apiClient } from '../../lib/api';
import { COMPASS_FLOW, getAllCompassScreens } from '../../lib/compass-flow';
import { useAuth } from '../../auth/auth-context';
import { MultiInputEditor } from './MultiInputEditor';
import type {
  CompassAnswerRecord,
  CompassAnswers,
  CompassScreenDefinition,
  CompassSessionDetail,
} from '../../types/compass';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function CompassSessionRunner({
  initialSession,
}: {
  initialSession: CompassSessionDetail;
}) {
  const navigate = useNavigate();
  const { refreshBootstrap } = useAuth();
  const allScreens = useMemo(() => getAllCompassScreens(), []);
  const totalScreens = allScreens.length;
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(initialSession.currentScreen, totalScreens - 1),
  );
  const [answers, setAnswers] = useState<CompassAnswers>(initialSession.answers ?? {});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [session, setSession] = useState(initialSession);
  const [completing, setCompleting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnswersRef = useRef<CompassAnswers>(initialSession.answers ?? {});

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const screen = allScreens[currentIndex];

  const screenAnswers = useMemo<CompassAnswerRecord>(() => {
    const current = answers[screen.id] ?? {};

    if (screen.prefillFrom && Object.keys(current).length === 0) {
      const source = answers[screen.prefillFrom];

      if (source) {
        const values = Object.values(source).filter(Boolean);
        if (values.length > 0) {
          return { main: values.join('\n') };
        }
      }
    }

    return current;
  }, [answers, screen.id, screen.prefillFrom]);

  const currentSection = COMPASS_FLOW.find(section => section.key === screen.sectionKey) ?? COMPASS_FLOW[0];
  const progress = Math.round(((currentIndex + 1) / totalScreens) * 100);

  if (session.status === 'completed') {
    return (
      <CompletedCompassSummary
        session={session}
        onBackToCompass={() => navigate(GOLDEN_COMPASS_PATH)}
        onBackToWeek={() => navigate(QUANTUM_PLANNER_PATH)}
      />
    );
  }

  function pulseSaveStatus(nextStatus: SaveStatus) {
    setSaveStatus(nextStatus);

    if (nextStatus === 'saved' || nextStatus === 'error') {
      window.setTimeout(() => {
        setSaveStatus(current => (current === nextStatus ? 'idle' : current));
      }, nextStatus === 'saved' ? 1800 : 2800);
    }
  }

  async function persist(input: { answers?: CompassAnswers; currentScreen?: number }) {
    try {
      setSaveStatus('saving');
      const updated = await apiClient.updateCompassSession(initialSession.id, input);
      setSession(updated);
      pulseSaveStatus('saved');
      return updated;
    } catch {
      pulseSaveStatus('error');
      return null;
    }
  }

  function scheduleAnswerSave(nextAnswers: CompassAnswers) {
    pendingAnswersRef.current = nextAnswers;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void persist({ answers: pendingAnswersRef.current });
    }, 900);
  }

  async function flushAnswerSave(): Promise<void> {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    await persist({
      answers: pendingAnswersRef.current,
      currentScreen: currentIndex,
    });
  }

  function updateAnswer(key: string, value: string) {
    setAnswers(previous => {
      const nextAnswers = {
        ...previous,
        [screen.id]: {
          ...(previous[screen.id] ?? {}),
          [key]: value,
        },
      };
      scheduleAnswerSave(nextAnswers);
      return nextAnswers;
    });
  }

  function setMultiInputItems(items: string[]) {
    updateAnswer('items', JSON.stringify(items.filter(item => item.trim().length > 0)));
  }

  function canProceed(currentScreenDefinition: CompassScreenDefinition): boolean {
    if (currentScreenDefinition.type === 'interstitial' || currentScreenDefinition.type === 'animation' || currentScreenDefinition.type === 'ritual') {
      return true;
    }

    if (currentScreenDefinition.type === 'checklist' && currentScreenDefinition.requireAllChecked) {
      return (currentScreenDefinition.checklistItems ?? []).every(item => screenAnswers[item.key] === 'true');
    }

    if (!currentScreenDefinition.isRequired) {
      return true;
    }

    if (currentScreenDefinition.type === 'textarea' || currentScreenDefinition.type === 'short-text') {
      return (screenAnswers.main ?? '').trim().length > 0;
    }

    if (currentScreenDefinition.type === 'multi-short-text' || currentScreenDefinition.type === 'multi-textarea') {
      return (currentScreenDefinition.inputs ?? []).every(input => (screenAnswers[input.key] ?? '').trim().length > 0);
    }

    if (currentScreenDefinition.type === 'multi-input') {
      try {
        const items = JSON.parse(screenAnswers.items ?? '[]');
        return Array.isArray(items) && items.length > 0;
      } catch {
        return false;
      }
    }

    if (currentScreenDefinition.type === 'signature') {
      return (screenAnswers.name ?? '').trim().length > 0 && (screenAnswers.signature ?? '').trim().length > 0;
    }

    return true;
  }

  async function moveTo(nextIndex: number) {
    setCurrentIndex(nextIndex);
    await persist({ currentScreen: nextIndex });
  }

  async function handleNext() {
    if (!canProceed(screen) || completing) {
      return;
    }

    if (currentIndex >= totalScreens - 1) {
      setCompleting(true);
      await flushAnswerSave();

      try {
        const updated = await apiClient.updateCompassSession(initialSession.id, {
          answers: pendingAnswersRef.current,
          currentScreen: currentIndex,
          status: 'completed',
        });
        setSession(updated);
        await refreshBootstrap();
      } finally {
        setCompleting(false);
      }
      return;
    }

    await moveTo(currentIndex + 1);
  }

  async function handleBack() {
    if (currentIndex === 0 || completing) {
      return;
    }

    await moveTo(currentIndex - 1);
  }

  async function handleSaveAndExit() {
    await flushAnswerSave();
    navigate(GOLDEN_COMPASS_PATH);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,_rgba(245,208,116,0.12),_rgba(17,24,39,0.98)_50%)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              {currentSection.title}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-100">{session.title}</h1>
            <p className="mt-2 text-sm text-gray-300">{currentSection.subtitle}</p>
          </div>
          <div className="rounded-full border border-gray-700 bg-gray-950/70 px-4 py-2 text-sm font-semibold text-gray-200">
            {currentIndex + 1} / {totalScreens}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-gray-900">
            <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-gray-500">
            <span>{progress}% complete</span>
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'Saved'
                  : saveStatus === 'error'
                    ? 'Save issue'
                    : 'Autosave on'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-gray-800 bg-gray-900/70 p-8">
        {screen.headline ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">{screen.headline}</p>
        ) : null}
        {screen.narrativeText ? (
          <p className="mt-3 whitespace-pre-line text-base leading-7 text-gray-300">{screen.narrativeText}</p>
        ) : null}
        {screen.questionText ? (
          <h2 className="mt-5 text-2xl font-semibold text-gray-100">{screen.questionText}</h2>
        ) : null}

        <div className="mt-8">
          <CompassFieldRenderer
            screen={screen}
            answers={screenAnswers}
            onAnswerChange={updateAnswer}
            onMultiInputChange={setMultiInputItems}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentIndex === 0 || completing}
              className="rounded-full border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={completing}
              className="rounded-full border border-gray-700 bg-gray-950/80 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save and Exit
            </button>
          </div>
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={!canProceed(screen) || completing}
            className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:border-amber-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completing ? 'Completing...' : currentIndex === totalScreens - 1 ? 'Complete Compass' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompassFieldRenderer({
  screen,
  answers,
  onAnswerChange,
  onMultiInputChange,
}: {
  screen: CompassScreenDefinition;
  answers: CompassAnswerRecord;
  onAnswerChange: (key: string, value: string) => void;
  onMultiInputChange: (items: string[]) => void;
}) {
  if (screen.type === 'interstitial' || screen.type === 'animation') {
    return <p className="text-sm leading-7 text-gray-400">Continue when you're ready.</p>;
  }

  if (screen.type === 'ritual') {
    const priorItems = (answers.main ?? '')
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4">
        <p className="text-sm leading-7 text-gray-300">
          Pause here and consciously release the items you wrote. This step is about direction, not self-punishment.
        </p>
        {priorItems.length > 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">From the compassion box</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {priorItems.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (screen.type === 'textarea') {
    return (
      <textarea
        value={answers.main ?? ''}
        onChange={event => onAnswerChange('main', event.target.value)}
        placeholder={screen.placeholder ?? 'Write here...'}
        rows={8}
        className="w-full rounded-3xl border border-gray-800 bg-gray-950/70 px-4 py-4 text-sm leading-7 text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
      />
    );
  }

  if (screen.type === 'short-text') {
    return (
      <input
        type="text"
        value={answers.main ?? ''}
        onChange={event => onAnswerChange('main', event.target.value)}
        placeholder={screen.placeholder ?? 'Write here...'}
        className="w-full rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
      />
    );
  }

  if (screen.type === 'multi-short-text' || screen.type === 'multi-textarea') {
    return (
      <div className="space-y-3">
        {(screen.inputs ?? []).map(input => {
          const isLong = screen.type === 'multi-textarea' || input.type === 'long';

          return isLong ? (
            <textarea
              key={input.key}
              value={answers[input.key] ?? ''}
              onChange={event => onAnswerChange(input.key, event.target.value)}
              placeholder={input.placeholder ?? 'Write here...'}
              rows={4}
              className="w-full rounded-3xl border border-gray-800 bg-gray-950/70 px-4 py-4 text-sm leading-7 text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
            />
          ) : (
            <input
              key={input.key}
              type="text"
              value={answers[input.key] ?? ''}
              onChange={event => onAnswerChange(input.key, event.target.value)}
              placeholder={input.placeholder ?? 'Write here...'}
              className="w-full rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
            />
          );
        })}
      </div>
    );
  }

  if (screen.type === 'checklist') {
    return (
      <div className="space-y-3">
        {(screen.checklistItems ?? []).map(item => {
          const checked = answers[item.key] === 'true';

          return (
            <label
              key={item.key}
              className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-950/50 px-4 py-3 text-sm text-gray-200"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={event => onAnswerChange(item.key, String(event.target.checked))}
                className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-900 text-amber-300"
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (screen.type === 'multi-input') {
    const items = parseMultiInputItems(answers.items);

    return (
      <MultiInputEditor
        key={screen.id}
        items={items}
        placeholder={screen.placeholder ?? 'Add an item...'}
        onChange={onMultiInputChange}
      />
    );
  }

  if (screen.type === 'signature') {
    const date = answers.date ?? new Date().toLocaleDateString();
    const time = answers.time ?? new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return (
      <div className="space-y-4">
        <input
          type="text"
          value={answers.name ?? ''}
          onChange={event => onAnswerChange('name', event.target.value)}
          placeholder="Your name"
          className="w-full rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
        />
        <textarea
          value={answers.signature ?? ''}
          onChange={event => onAnswerChange('signature', event.target.value)}
          placeholder="Type your signature or commitment line"
          rows={3}
          className="w-full rounded-3xl border border-gray-800 bg-gray-950/70 px-4 py-4 text-sm leading-7 text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Date" value={date} />
          <ReadOnlyField label="Time" value={time} />
        </div>
      </div>
    );
  }

  return null;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-gray-200">{value}</p>
    </div>
  );
}
function parseMultiInputItems(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map(item => String(item).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function CompletedCompassSummary({
  session,
  onBackToCompass,
  onBackToWeek,
}: {
  session: CompassSessionDetail;
  onBackToCompass: () => void;
  onBackToWeek: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_rgba(17,24,39,0.98)_52%)] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Compass Completed</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-100">{session.title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-300">
          LAB stored the latest Compass insights and used them to refresh the strategic layer for this planning year.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Annual goals" items={session.insights?.annualGoals ?? []} />
        <SummaryCard title="Daily rituals" items={session.insights?.dailyRituals ?? []} />
        <SummaryCard title="Support people" items={session.insights?.supportPeople ?? []} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBackToWeek}
          className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:border-amber-200 hover:bg-amber-100"
        >
          Back to Weekly LAB
        </button>
        <button
          type="button"
          onClick={onBackToCompass}
          className="rounded-full border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:text-white"
        >
          Open Compass Library
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-gray-200">
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No insights captured for this section.</p>
      )}
    </div>
  );
}
