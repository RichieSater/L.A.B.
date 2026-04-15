import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GOLDEN_COMPASS_PATH,
  getGoldenCompassSessionViewPath,
  QUANTUM_PLANNER_PATH,
} from '../../constants/routes';
import { useAuth } from '../../auth/auth-context';
import {
  encodeCompassListAnswer,
  parseCompassListAnswer,
  resolveCompassListItems,
} from '../../lib/compass-answer-normalization';
import { apiClient } from '../../lib/api';
import { COMPASS_FLOW, getAllCompassScreens } from '../../lib/compass-flow';
import {
  hasPastMonthlyEventEntries,
  LEGACY_PAST_MONTH_KEYS,
  PAST_MONTHLY_EVENTS_SCREEN_ID,
  PAST_MONTHS_INCLUDE_CURRENT_KEY,
  PAST_MONTHS_SCREEN_ID,
  resolvePastMonthsState,
} from '../../lib/compass-past-months';
import { CompassPreviewDocument } from './CompassPreviewDocument';
import { MultiInputEditor } from './MultiInputEditor';
import type {
  CompassAnswerRecord,
  CompassAnswers,
  CompassChecklistItem,
  CompassContentBlock,
  CompassPromptDefinition,
  CompassScreenDefinition,
  CompassSessionDetail,
  UpdateCompassSessionInput,
} from '../../types/compass';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
const COMPASS_IDLE_SAVE_MS = 4000;

function areCompassAnswerRecordsEqual(left: CompassAnswerRecord, right: CompassAnswerRecord): boolean {
  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([key, value], index) => {
    const [otherKey, otherValue] = rightEntries[index] ?? [];
    return key === otherKey && value === otherValue;
  });
}

function areCompassAnswersEqual(left: CompassAnswers, right: CompassAnswers): boolean {
  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([screenId, record], index) => {
    const [otherScreenId, otherRecord] = rightEntries[index] ?? [];
    return screenId === otherScreenId && areCompassAnswerRecordsEqual(record, otherRecord ?? {});
  });
}

export function CompassSessionRunner({
  initialSession,
}: {
  initialSession: CompassSessionDetail;
}) {
  const navigate = useNavigate();
  const { refreshBootstrap } = useAuth();
  const allScreens = useMemo(() => getAllCompassScreens(), []);
  const screenMap = useMemo(
    () => new Map(allScreens.map(entry => [entry.id, entry])),
    [allScreens],
  );
  const sessionCreatedAt = useMemo(() => new Date(initialSession.createdAt), [initialSession.createdAt]);
  const totalScreens = allScreens.length;
  const [currentIndex, setCurrentIndex] = useState(() => resolveInitialCompassIndex(initialSession, allScreens, screenMap));
  const [answers, setAnswers] = useState<CompassAnswers>(initialSession.answers ?? {});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [session, setSession] = useState(initialSession);
  const [completing, setCompleting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef<CompassAnswers>(initialSession.answers ?? {});
  const persistedAnswersRef = useRef<CompassAnswers>(initialSession.answers ?? {});
  const sessionRef = useRef(initialSession);
  const currentIndexRef = useRef(currentIndex);
  const persistPromiseRef = useRef<Promise<CompassSessionDetail | null> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const screen = allScreens[currentIndex];
  const pastMonthsState = useMemo(
    () => resolvePastMonthsState(answers[PAST_MONTHS_SCREEN_ID], sessionCreatedAt),
    [answers, sessionCreatedAt],
  );
  const screenAnswers = useMemo(
    () => resolveScreenAnswers(screen, answers, sessionCreatedAt, screenMap),
    [answers, screen, screenMap, sessionCreatedAt],
  );
  const persistedScreenAnswers = useMemo(
    () => resolveScreenAnswers(screen, session.answers ?? {}, sessionCreatedAt, screenMap),
    [screen, screenMap, session.answers, sessionCreatedAt],
  );
  const currentSection = COMPASS_FLOW.find(section => section.key === screen.sectionKey) ?? COMPASS_FLOW[0];
  const progress = Math.round(((currentIndex + 1) / totalScreens) * 100);
  const previewSession = useMemo(
    () => ({
      ...session,
      answers,
    }),
    [answers, session],
  );

  if (session.status === 'completed') {
    return (
      <CompletedCompassSummary
        session={session}
        onBackToCompass={() => navigate(GOLDEN_COMPASS_PATH)}
        onBackToWeek={() => navigate(QUANTUM_PLANNER_PATH)}
        onViewCompass={() => navigate(getGoldenCompassSessionViewPath(session.id))}
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

  async function persist(input: UpdateCompassSessionInput) {
    try {
      setSaveStatus('saving');
      const updated = await apiClient.updateCompassSession(initialSession.id, input);
      setSession(updated);
      sessionRef.current = updated;
      pulseSaveStatus('saved');
      return updated;
    } catch {
      pulseSaveStatus('error');
      return null;
    }
  }

  function clearScheduledAnswerSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }

  function scheduleAnswerSave() {
    clearScheduledAnswerSave();
    saveTimerRef.current = setTimeout(() => {
      void persistAnswerDraft({}, { rescheduleIfDirty: true });
    }, COMPASS_IDLE_SAVE_MS);
  }

  function getNormalizedCurrentAnswers(): CompassAnswers {
    const normalizedAnswers = normalizeAnswersForCurrentScreenPersistence(
      allScreens[currentIndexRef.current],
      answersRef.current,
      sessionCreatedAt,
      screenMap,
    );

    if (!areCompassAnswersEqual(normalizedAnswers, answersRef.current)) {
      answersRef.current = normalizedAnswers;
      setAnswers(normalizedAnswers);
    }

    return normalizedAnswers;
  }

  function hasDirtyAnswers(answersSnapshot = getNormalizedCurrentAnswers()): boolean {
    return !areCompassAnswersEqual(answersSnapshot, persistedAnswersRef.current);
  }

  function setAnswerDraft(
    updater: (previous: CompassAnswers) => CompassAnswers,
    options: { flush?: boolean; schedule?: boolean } = {},
  ) {
    const nextAnswers = updater(answersRef.current);

    if (!areCompassAnswersEqual(nextAnswers, answersRef.current)) {
      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);
    }

    if (options.flush) {
      void flushAnswerSave();
      return;
    }

    if (options.schedule !== false) {
      scheduleAnswerSave();
    }
  }

  async function persistAnswerDraft(
    extra: UpdateCompassSessionInput = {},
    options: { rescheduleIfDirty?: boolean } = {},
  ): Promise<CompassSessionDetail | null> {
    clearScheduledAnswerSave();

    if (persistPromiseRef.current) {
      await persistPromiseRef.current;
      return persistAnswerDraft(extra, options);
    }

    const normalizedAnswers = getNormalizedCurrentAnswers();
    const answersChanged = !areCompassAnswersEqual(normalizedAnswers, persistedAnswersRef.current);
    const payload: UpdateCompassSessionInput = {};

    if (answersChanged) {
      payload.answers = normalizedAnswers;
    }

    if (
      extra.currentScreen !== undefined &&
      extra.currentScreen !== sessionRef.current.currentScreen
    ) {
      payload.currentScreen = extra.currentScreen;
    }

    if (extra.status !== undefined && extra.status !== sessionRef.current.status) {
      payload.status = extra.status;
    }

    if (Object.keys(payload).length === 0) {
      return null;
    }

    const draftSnapshot = normalizedAnswers;
    const persistPromise = persist(payload)
      .then(updated => {
        if (!updated) {
          if (options.rescheduleIfDirty && hasDirtyAnswers(draftSnapshot)) {
            scheduleAnswerSave();
          }
          return null;
        }

        const persistedAnswers = updated.answers ?? draftSnapshot;
        const draftChangedDuringPersist = !areCompassAnswersEqual(answersRef.current, draftSnapshot);

        persistedAnswersRef.current = persistedAnswers;

        if (!draftChangedDuringPersist && !areCompassAnswersEqual(answersRef.current, persistedAnswers)) {
          answersRef.current = persistedAnswers;
          setAnswers(persistedAnswers);
        }

        if (options.rescheduleIfDirty && hasDirtyAnswers()) {
          scheduleAnswerSave();
        }

        return updated;
      })
      .finally(() => {
        if (persistPromiseRef.current === persistPromise) {
          persistPromiseRef.current = null;
        }
      });

    persistPromiseRef.current = persistPromise;
    return persistPromise;
  }

  async function flushAnswerSave(extra: UpdateCompassSessionInput = {}): Promise<CompassSessionDetail | null> {
    clearScheduledAnswerSave();

    let nextExtra = extra;

    while (persistPromiseRef.current || hasDirtyAnswers() || Object.keys(nextExtra).length > 0) {
      if (persistPromiseRef.current) {
        await persistPromiseRef.current;
        continue;
      }

      const updated = await persistAnswerDraft(nextExtra);
      nextExtra = {};

      if (!updated) {
        return hasDirtyAnswers() ? null : sessionRef.current;
      }
    }

    return sessionRef.current;
  }

  function updateAnswer(
    key: string,
    value: string,
    options: { flush?: boolean; schedule?: boolean } = {},
  ) {
    setAnswerDraft(previous => ({
      ...previous,
      [screen.id]: {
        ...(previous[screen.id] ?? {}),
        [key]: value,
      },
    }), options);
  }

  function setMultiInputItems(
    key: string,
    items: string[],
    options: { flush?: boolean; schedule?: boolean } = {},
  ) {
    updateAnswer(key, encodeCompassListAnswer(items), options);
  }

  function setPastMonthsIncludeCurrentMonth(includeCurrentMonth: boolean) {
    const nextRecord = {
      [PAST_MONTHS_INCLUDE_CURRENT_KEY]: String(includeCurrentMonth),
    };

    setAnswerDraft(previous => ({
        ...previous,
        [PAST_MONTHS_SCREEN_ID]: nextRecord,
      }),
      { flush: true },
    );
  }

  async function moveTo(nextIndex: number) {
    await flushAnswerSave({ currentScreen: nextIndex });
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
  }

  async function handleNext() {
    if (!canProceed(screen, screenAnswers) || completing) {
      return;
    }

    if (currentIndex >= totalScreens - 1) {
      setCompleting(true);

      try {
        const updated = await flushAnswerSave({
          currentScreen: currentIndex,
          status: 'completed',
        });

        if (updated?.status === 'completed') {
          await refreshBootstrap();
        }
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
    await flushAnswerSave({ currentScreen: currentIndexRef.current });
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

        {screen.contentBlocks?.length ? (
          <div className="mt-5 space-y-4">
            {screen.contentBlocks.map((block, index) => (
              <ContentBlockView key={`${screen.id}-content-${index}`} block={block} />
            ))}
          </div>
        ) : null}

        {screen.type === 'ritual' ? (
          <RitualPreview items={extractCompassionItems(answers)} />
        ) : null}

        {screen.type === 'preview' && screen.previewConfig ? (
          <div className="mt-8">
            <CompassPreviewDocument
              session={previewSession}
              config={screen.previewConfig}
              showDocumentIntro={false}
            />
          </div>
        ) : screen.id === PAST_MONTHS_SCREEN_ID ? (
          <PastMonthsToggle
            includeCurrentMonth={pastMonthsState.includeCurrentMonth}
            monthNames={pastMonthsState.monthNames}
            onToggle={setPastMonthsIncludeCurrentMonth}
          />
        ) : screen.id === PAST_MONTHLY_EVENTS_SCREEN_ID ? (
          <PastMonthlyEventsEditor
            monthNames={pastMonthsState.monthNames}
            answers={screenAnswers}
            persistedAnswers={persistedScreenAnswers}
            onItemsChange={setMultiInputItems}
            onItemsDraftChange={(key, items) => {
              setMultiInputItems(key, items, { schedule: false });
            }}
          />
        ) : screen.prompts?.length ? (
          <div className="mt-8 space-y-6">
            {screen.prompts.map((prompt, promptIndex) => (
              <div
                key={`${screen.id}-${prompt.key}-${promptIndex}`}
                className="space-y-4 rounded-3xl border border-gray-800/80 bg-gray-950/40 p-5"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-100">{prompt.label}</h2>
                  {prompt.description ? (
                    <p className="text-sm leading-6 text-gray-400">{prompt.description}</p>
                  ) : null}
                  {prompt.copyLines?.length ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                        Copy these lines
                      </p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-amber-50">
                        {prompt.copyLines.map(line => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <CompassPromptField
                  screenId={screen.id}
                  prompt={prompt}
                  answers={screenAnswers}
                  persistedAnswers={persistedScreenAnswers}
                  onAnswerChange={updateAnswer}
                  onMultiInputChange={setMultiInputItems}
                  onMultiInputDraftChange={(key, items) => {
                    setMultiInputItems(key, items, { schedule: false });
                  }}
                  onCommitRequest={() => {
                    void flushAnswerSave();
                  }}
                  onAdvanceRequest={() => {
                    void handleNext();
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-sm leading-7 text-gray-400">
              {screen.type === 'animation'
                ? 'Pause here, then complete the workbook when you are ready.'
                : "Continue when you're ready."}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-6">
          <div className="flex gap-3">
            <button
              type="button"
              onMouseDown={event => {
                event.preventDefault();
              }}
              onClick={handleBack}
              disabled={currentIndex === 0 || completing}
              className="rounded-full border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onMouseDown={event => {
                event.preventDefault();
              }}
              onClick={handleSaveAndExit}
              disabled={completing}
              className="rounded-full border border-gray-700 bg-gray-950/80 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save and Exit
            </button>
          </div>
          <button
            type="button"
            onMouseDown={event => {
              event.preventDefault();
            }}
            onClick={() => void handleNext()}
            disabled={!canProceed(screen, screenAnswers) || completing}
            className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:border-amber-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completing ? 'Completing...' : currentIndex === totalScreens - 1 ? 'Complete Compass' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentBlockView({ block }: { block: CompassContentBlock }) {
  const isHighlighted = block.tone === 'callout' || block.tone === 'quote';

  return (
    <div
      className={
        isHighlighted
          ? 'rounded-2xl border border-gray-800 bg-gray-950/60 p-4'
          : 'space-y-3'
      }
    >
      {block.title ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{block.title}</p>
      ) : null}
      {block.paragraphs?.map(paragraph => (
        <p
          key={paragraph}
          className={`text-sm leading-7 ${block.tone === 'quote' ? 'italic text-gray-200' : 'text-gray-300'}`}
        >
          {paragraph}
        </p>
      ))}
      {block.bullets?.length ? (
        <ul className="space-y-2 pl-5 text-sm leading-7 text-gray-300">
          {block.bullets.map(item => (
            <li key={item} className="list-disc">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {block.numberedItems?.length ? (
        <ol className="space-y-2 pl-5 text-sm leading-7 text-gray-300">
          {block.numberedItems.map(item => (
            <li key={item} className="list-decimal">
              {item}
            </li>
          ))}
        </ol>
      ) : null}
      {block.attribution ? (
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{block.attribution}</p>
      ) : null}
    </div>
  );
}

function RitualPreview({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">From the compassion box</p>
      <ul className="mt-3 space-y-2 text-sm text-gray-300">
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CompassPromptField({
  screenId,
  prompt,
  answers,
  persistedAnswers,
  onAnswerChange,
  onMultiInputChange,
  onMultiInputDraftChange,
  onCommitRequest,
  onAdvanceRequest,
}: {
  screenId: string;
  prompt: CompassPromptDefinition;
  answers: CompassAnswerRecord;
  persistedAnswers: CompassAnswerRecord;
  onAnswerChange: (key: string, value: string, options?: { flush?: boolean; schedule?: boolean }) => void;
  onMultiInputChange: (key: string, items: string[], options?: { flush?: boolean; schedule?: boolean }) => void;
  onMultiInputDraftChange: (key: string, items: string[]) => void;
  onCommitRequest: () => void;
  onAdvanceRequest: () => void;
}) {
  function handleShortTextKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      onAdvanceRequest();
    }
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onAdvanceRequest();
    }
  }

  if (prompt.type === 'textarea') {
    const fieldId = `${screenId}-${prompt.key}`;

    return (
      <textarea
        id={fieldId}
        aria-label={prompt.label}
        value={answers[prompt.key] ?? ''}
        onChange={event => onAnswerChange(prompt.key, event.target.value)}
        onBlur={onCommitRequest}
        onKeyDown={handleTextareaKeyDown}
        placeholder={prompt.placeholder ?? 'Write here...'}
        rows={8}
        className="w-full rounded-3xl border border-gray-800 bg-gray-950/70 px-4 py-4 text-sm leading-7 text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
      />
    );
  }

  if (prompt.type === 'short-text') {
    const fieldId = `${screenId}-${prompt.key}`;

    return (
      <input
        id={fieldId}
        aria-label={prompt.label}
        type="text"
        value={answers[prompt.key] ?? ''}
        onChange={event => onAnswerChange(prompt.key, event.target.value)}
        onBlur={onCommitRequest}
        onKeyDown={handleShortTextKeyDown}
        placeholder={prompt.placeholder ?? 'Write here...'}
        className="w-full rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
      />
    );
  }

  if (prompt.type === 'multi-short-text' || prompt.type === 'multi-textarea') {
    return (
      <div className="space-y-4">
        {(prompt.inputs ?? []).map((input, index) => {
          const inputId = `${screenId}-${input.key}`;
          const inputLabel = input.label ?? input.placeholder ?? `Field ${index + 1}`;
          const isLong = prompt.type === 'multi-textarea' || input.type === 'long';

          return (
            <div key={input.key} className="space-y-2">
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-200">
                {inputLabel}
              </label>
              {isLong ? (
                <textarea
                  id={inputId}
                  aria-label={inputLabel}
                  value={answers[input.key] ?? ''}
                  onChange={event => onAnswerChange(input.key, event.target.value)}
                  onBlur={onCommitRequest}
                  placeholder={input.placeholder ?? 'Write here...'}
                  rows={4}
                  className="w-full rounded-3xl border border-gray-800 bg-gray-950/70 px-4 py-4 text-sm leading-7 text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
                />
              ) : (
                <input
                  id={inputId}
                  aria-label={inputLabel}
                  type="text"
                  value={answers[input.key] ?? ''}
                  onChange={event => onAnswerChange(input.key, event.target.value)}
                  onBlur={onCommitRequest}
                  placeholder={input.placeholder ?? 'Write here...'}
                  className="w-full rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (prompt.type === 'checklist') {
    return (
      <div className="space-y-3">
        {(prompt.checklistItems ?? []).map(item => (
          <ChecklistRow
            key={item.key}
            item={item}
            screenId={screenId}
            checked={answers[item.key] === 'true'}
            onChange={value => onAnswerChange(item.key, value, { flush: true })}
          />
        ))}
      </div>
    );
  }

  if (prompt.type === 'multi-input') {
    return (
        <MultiInputEditor
          key={`${screenId}-${prompt.key}`}
          items={parseMultiInputItems(answers[prompt.key])}
          committedItems={parseMultiInputItems(persistedAnswers[prompt.key])}
          placeholder={prompt.placeholder ?? 'Add an item...'}
          inputLabelPrefix={prompt.label}
          addItemLabel={`Add item for ${prompt.label}`}
          minItems={prompt.minItems}
          maxItems={prompt.maxItems}
          onDraftChange={items => onMultiInputDraftChange(prompt.key, items)}
          onChange={items => onMultiInputChange(prompt.key, items, { flush: true, schedule: false })}
          onAdvanceRequest={onAdvanceRequest}
        />
      );
  }

  if (prompt.type === 'signature') {
    const date = answers.date ?? new Date().toLocaleDateString();
    const time = answers.time ?? new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return (
      <div className="space-y-4">
        <input
          type="text"
          aria-label="Your name"
          value={answers.name ?? ''}
          onChange={event => onAnswerChange('name', event.target.value)}
          onBlur={onCommitRequest}
          placeholder="Your name"
          className="w-full rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
        />
        <textarea
          aria-label="Your signature"
          value={answers.signature ?? ''}
          onChange={event => onAnswerChange('signature', event.target.value)}
          onBlur={onCommitRequest}
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

function PastMonthsToggle({
  includeCurrentMonth,
  monthNames,
  onToggle,
}: {
  includeCurrentMonth: boolean;
  monthNames: string[];
  onToggle: (includeCurrentMonth: boolean) => void;
}) {
  return (
    <div className="mt-8 rounded-3xl border border-gray-800/80 bg-gray-950/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-semibold text-gray-100">The previous 12 months</h2>
          <p className="text-sm leading-6 text-gray-400">
            This list is read-only. Toggle whether the current month is part of the past-year window for this session.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            {includeCurrentMonth ? 'Current month included' : 'Using the last full 12 completed months'}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={includeCurrentMonth}
          onClick={() => onToggle(!includeCurrentMonth)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            includeCurrentMonth
              ? 'border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-200 hover:bg-amber-100'
              : 'border-gray-700 bg-gray-950/80 text-gray-200 hover:border-gray-500 hover:text-white'
          }`}
        >
          Include current month
        </button>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Previous 12 months">
        {monthNames.map(monthName => (
          <li
            key={monthName}
            className="rounded-2xl border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm font-medium text-gray-100"
          >
            {monthName}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PastMonthlyEventsEditor({
  monthNames,
  answers,
  persistedAnswers,
  onItemsChange,
  onItemsDraftChange,
}: {
  monthNames: string[];
  answers: CompassAnswerRecord;
  persistedAnswers: CompassAnswerRecord;
  onItemsChange: (key: string, items: string[], options?: { flush?: boolean; schedule?: boolean }) => void;
  onItemsDraftChange: (key: string, items: string[]) => void;
}) {
  return (
    <div className="mt-8 space-y-6 rounded-3xl border border-gray-800/80 bg-gray-950/40 p-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-100">Important things that happened in each month</h2>
        <p className="text-sm leading-6 text-gray-400">
          For each month, note any events that had a significant impact on your life.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {monthNames.map((monthName, index) => {
          const fieldKey = LEGACY_PAST_MONTH_KEYS[index];

          return (
            <div key={fieldKey} className="space-y-2 rounded-2xl border border-gray-800 bg-gray-900/70 p-4">
              <p className="block text-sm font-semibold text-gray-100">{monthName}</p>
              <MultiInputEditor
                key={`${fieldKey}-${monthName}`}
                items={parseMultiInputItems(answers[fieldKey])}
                committedItems={parseMultiInputItems(persistedAnswers[fieldKey])}
                placeholder={`What mattered in ${monthName}?`}
                inputLabelPrefix={`${monthName} event`}
                addItemLabel={`Add event for ${monthName}`}
                onDraftChange={items => onItemsDraftChange(fieldKey, items)}
                onChange={items => onItemsChange(fieldKey, items, { flush: true, schedule: false })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  screenId,
  checked,
  onChange,
}: {
  item: CompassChecklistItem;
  screenId: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  const fieldId = `${screenId}-${item.key}`;

  return (
    <label
      htmlFor={fieldId}
      className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-950/50 px-4 py-3 text-sm text-gray-200"
    >
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        onChange={event => onChange(String(event.target.checked))}
        className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-900 text-amber-300"
      />
      <span>{item.label}</span>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm text-gray-200">{value}</p>
    </div>
  );
}

function resolveInitialCompassIndex(
  session: CompassSessionDetail,
  screens: CompassScreenDefinition[],
  screenMap: Map<string, CompassScreenDefinition>,
): number {
  const sessionCreatedAt = new Date(session.createdAt);
  const storedIndex = Math.min(Math.max(session.currentScreen, 0), screens.length - 1);
  const hasEarlierAnswers = screens
    .slice(0, storedIndex)
    .some(screen =>
      Object.entries(session.answers?.[screen.id] ?? {}).some(([key, value]) => hasMeaningfulAnswerValue(key, value)),
    );

  if (!hasEarlierAnswers) {
    return storedIndex;
  }

  for (let index = 0; index <= storedIndex; index += 1) {
    const screen = screens[index];
    const resolvedAnswers = resolveScreenAnswers(screen, session.answers ?? {}, sessionCreatedAt, screenMap);

    if (
      screen.id === PAST_MONTHLY_EVENTS_SCREEN_ID &&
      storedIndex > index &&
      !hasPastMonthlyEventEntries(resolvedAnswers)
    ) {
      continue;
    }

    if (!canProceed(screen, resolvedAnswers)) {
      return index;
    }
  }

  return storedIndex;
}

function resolveScreenAnswers(
  screen: CompassScreenDefinition,
  answers: CompassAnswers,
  sessionCreatedAt: Date,
  screenMap: Map<string, CompassScreenDefinition>,
): CompassAnswerRecord {
  if (screen.id === PAST_MONTHS_SCREEN_ID) {
    const state = resolvePastMonthsState(answers[PAST_MONTHS_SCREEN_ID], sessionCreatedAt);
    return {
      [PAST_MONTHS_INCLUDE_CURRENT_KEY]: String(state.includeCurrentMonth),
    };
  }

  const current = normalizeScreenPromptAnswers(screen, answers[screen.id] ?? {});

  if (screen.prefillFrom && Object.keys(current).length === 0) {
    const prefilled = resolvePrefillAnswers(screen, answers, screenMap);
    if (prefilled) {
      return prefilled;
    }
  }

  return current;
}

function canProceed(screen: CompassScreenDefinition, answers: CompassAnswerRecord): boolean {
  if (screen.id === PAST_MONTHS_SCREEN_ID) {
    return true;
  }

  if (screen.id === PAST_MONTHLY_EVENTS_SCREEN_ID) {
    return hasPastMonthlyEventEntries(answers);
  }

  if (!screen.prompts?.length) {
    return true;
  }

  return screen.prompts.every(prompt => {
    if (!prompt.isRequired) {
      return true;
    }

    if (prompt.type === 'checklist' && prompt.requireAllChecked) {
      return (prompt.checklistItems ?? []).every(item => answers[item.key] === 'true');
    }

    if (prompt.type === 'textarea' || prompt.type === 'short-text') {
      return (answers[prompt.key] ?? '').trim().length > 0;
    }

    if (prompt.type === 'multi-short-text' || prompt.type === 'multi-textarea') {
      return (prompt.inputs ?? []).every(input => (answers[input.key] ?? '').trim().length > 0);
    }

    if (prompt.type === 'multi-input') {
      const minItems = prompt.minItems ?? 1;
      return parseMultiInputItems(answers[prompt.key]).length >= minItems;
    }

    if (prompt.type === 'signature') {
      return (answers.name ?? '').trim().length > 0 && (answers.signature ?? '').trim().length > 0;
    }

    return true;
  });
}

function extractCompassionItems(answers: CompassAnswers): string[] {
  return resolveCompassListItems(answers['past-compassion-box'], { key: 'main' });
}

function parseMultiInputItems(value: string | undefined): string[] {
  return parseCompassListAnswer(value);
}

function hasMeaningfulAnswerValue(key: string, value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  if (value === 'true' || value === 'false') {
    return key === PAST_MONTHS_INCLUDE_CURRENT_KEY ? true : value === 'true';
  }

  return parseCompassListAnswer(value).length > 0;
}

function normalizeAnswersForCurrentScreenPersistence(
  screen: CompassScreenDefinition,
  answers: CompassAnswers,
  sessionCreatedAt: Date,
  screenMap: Map<string, CompassScreenDefinition>,
): CompassAnswers {
  let nextAnswers = answers;

  if (screen.id === PAST_MONTHS_SCREEN_ID) {
    const state = resolvePastMonthsState(answers[PAST_MONTHS_SCREEN_ID], sessionCreatedAt);
    const normalizedRecord = {
      [PAST_MONTHS_INCLUDE_CURRENT_KEY]: String(state.includeCurrentMonth),
    };
    const currentRecord = answers[PAST_MONTHS_SCREEN_ID];

    if (
      !currentRecord ||
      Object.keys(currentRecord).length !== 1 ||
      currentRecord[PAST_MONTHS_INCLUDE_CURRENT_KEY] !== normalizedRecord[PAST_MONTHS_INCLUDE_CURRENT_KEY]
    ) {
      nextAnswers = {
        ...nextAnswers,
        [PAST_MONTHS_SCREEN_ID]: normalizedRecord,
      };
    }
  }

  if (!screen.prompts?.length) {
    return nextAnswers;
  }

  const currentRecord = nextAnswers[screen.id] ?? {};
  const normalizedRecord = normalizeScreenPromptAnswers(screen, currentRecord, { stripLegacyKeys: true });

  if (screen.prefillFrom && Object.keys(normalizedRecord).length === 0) {
    const prefilled = resolvePrefillAnswers(screen, nextAnswers, screenMap);
    if (prefilled) {
      return {
        ...nextAnswers,
        [screen.id]: prefilled,
      };
    }
  }

  if (recordsEqual(currentRecord, normalizedRecord)) {
    return nextAnswers;
  }

  return {
    ...nextAnswers,
    [screen.id]: normalizedRecord,
  };
}

function normalizeScreenPromptAnswers(
  screen: CompassScreenDefinition,
  record: CompassAnswerRecord,
  options: { stripLegacyKeys?: boolean } = {},
): CompassAnswerRecord {
  if (!screen.prompts?.length) {
    return record;
  }

  const normalizedRecord: CompassAnswerRecord = { ...record };

  for (const prompt of screen.prompts) {
    if (prompt.type !== 'multi-input') {
      continue;
    }

    const items = resolveCompassListItems(record, {
      key: prompt.key,
      legacyInputKeys: prompt.legacyInputKeys,
    });

    if (items.length > 0 || record[prompt.key] !== undefined) {
      normalizedRecord[prompt.key] = encodeCompassListAnswer(items);
    }

    if (options.stripLegacyKeys) {
      for (const legacyKey of prompt.legacyInputKeys ?? []) {
        delete normalizedRecord[legacyKey];
      }
    }
  }

  return normalizedRecord;
}

function resolvePrefillAnswers(
  screen: CompassScreenDefinition,
  answers: CompassAnswers,
  screenMap: Map<string, CompassScreenDefinition>,
): CompassAnswerRecord | null {
  if (!screen.prefillFrom || !screen.prompts?.length) {
    return null;
  }

  const sourceScreen = screenMap.get(screen.prefillFrom);
  const sourcePrompt = sourceScreen?.prompts?.[0];
  const targetPrompt = screen.prompts[0];

  if (!sourceScreen || !sourcePrompt || !targetPrompt) {
    return null;
  }

  if (sourcePrompt.type === 'multi-input' && targetPrompt.type === 'multi-input') {
    const items = resolveCompassListItems(answers[sourceScreen.id], {
      key: sourcePrompt.key,
      legacyInputKeys: sourcePrompt.legacyInputKeys,
    });

    if (items.length === 0) {
      return null;
    }

    const cappedItems =
      targetPrompt.maxItems !== undefined ? items.slice(0, targetPrompt.maxItems) : items;

    return {
      [targetPrompt.key]: encodeCompassListAnswer(cappedItems),
    };
  }

  const sourceValues = Object.values(answers[sourceScreen.id] ?? {}).filter(value => value?.trim().length > 0);
  if (sourceValues.length === 0) {
    return null;
  }

  return {
    [targetPrompt.key]: sourceValues.join('\n'),
  };
}

function recordsEqual(left: CompassAnswerRecord, right: CompassAnswerRecord): boolean {
  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([key, value], index) => {
    const [otherKey, otherValue] = rightEntries[index] ?? [];
    return key === otherKey && value === otherValue;
  });
}

function CompletedCompassSummary({
  session,
  onBackToCompass,
  onBackToWeek,
  onViewCompass,
}: {
  session: CompassSessionDetail;
  onBackToCompass: () => void;
  onBackToWeek: () => void;
  onViewCompass: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_rgba(17,24,39,0.98)_52%)] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Compass Completed</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-100">{session.title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-300">
          LAB stored the latest Compass insights and richer workbook context so the rest of the system can use what you captured here.
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
          onClick={onViewCompass}
          className="rounded-full border border-amber-300/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-500/20"
        >
          View Compass
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
