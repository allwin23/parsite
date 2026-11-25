import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import type {
  TraceDay,
  TraceSession,
  TraceMessage,
  TraceBulletinItem,
  BatchTaskItem,
  TraceSessionStatus,
} from '../types/database';
import * as traceApi from '../lib/traceApi';
import { generateTurnPrompt, runWithConcurrency } from '../lib/gemini';

interface BatchProgress {
  active: boolean;
  completed: number;
  total: number;
}

interface TraceAssistContextType {
  // Days
  days: TraceDay[];
  activeDayId: string | null;
  activeDay: TraceDay | null;
  setActiveDayId: (id: string) => void;
  createDay: (label: string) => Promise<TraceDay>;
  deleteDay: (id: string) => Promise<void>;
  exportDayJson: (targetDayId?: string) => string;

  // Sessions
  sessions: TraceSession[];
  filteredSessions: TraceSession[];
  activeSessionId: string | null;
  activeSession: TraceSession | null;
  setActiveSessionId: (id: string | null) => void;
  createSession: (taskName: string, initialPrompt: string) => Promise<TraceSession>;
  deleteSession: (id: string) => Promise<void>;
  updateSessionStatus: (id: string, status: TraceSessionStatus) => Promise<void>;

  // Chat History
  messages: TraceMessage[];
  isGeneratingTurn: boolean;
  sendTurnMessage: (userPrompt: string) => Promise<void>;

  // Pre-Generated Turn Bulletin Queue
  bulletinItems: TraceBulletinItem[];
  saveToBulletin: (promptText: string) => Promise<void>;
  copyBulletinItem: (item: TraceBulletinItem) => Promise<void>;
  updateBulletinItem: (id: string, text: string) => Promise<void>;
  deleteBulletinItem: (id: string) => Promise<void>;

  // Notes Scratchpad (Strictly local reference)
  notes: string;
  setNotes: (notes: string) => void;

  // Search & Modals
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isBatchModalOpen: boolean;
  setIsBatchModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  batchProgress: BatchProgress;
  launchBatchTasks: (tasks: BatchTaskItem[], targetDayId?: string) => Promise<void>;

  // Loading
  isLoadingDays: boolean;
  isLoadingSessions: boolean;
  refreshDays: () => Promise<void>;
}

const TraceAssistContext = createContext<TraceAssistContextType | undefined>(undefined);

export const TraceAssistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [days, setDays] = useState<TraceDay[]>([]);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TraceSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TraceMessage[]>([]);
  const [bulletinItems, setBulletinItems] = useState<TraceBulletinItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoadingDays, setIsLoadingDays] = useState<boolean>(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isGeneratingTurn, setIsGeneratingTurn] = useState<boolean>(false);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    active: false,
    completed: 0,
    total: 0,
  });

  const notesDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Days on Mount
  const loadDays = useCallback(async () => {
    try {
      setIsLoadingDays(true);
      const fetchedDays = await traceApi.fetchTraceDays();
      setDays(fetchedDays);
      if (fetchedDays.length > 0) {
        // Default to first (today's) day
        setActiveDayId((curr) => curr || fetchedDays[0].id);
      }
    } catch (err) {
      console.error('Failed to load trace days:', err);
    } finally {
      setIsLoadingDays(false);
    }
  }, []);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  // 2. Active Day
  const activeDay = useMemo(() => {
    return days.find((d) => d.id === activeDayId) || null;
  }, [days, activeDayId]);

  // 3. Load Sessions when activeDayId changes
  useEffect(() => {
    if (!activeDayId) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    let isMounted = true;
    setIsLoadingSessions(true);
    traceApi
      .fetchTraceSessions(activeDayId)
      .then((sess) => {
        if (!isMounted) return;
        setSessions(sess);
        // Pre-select first session if none is active or active is outside this day
        if (sess.length > 0) {
          setActiveSessionId((curr) => {
            const exists = sess.some((s) => s.id === curr);
            return exists ? curr : sess[0].id;
          });
        } else {
          setActiveSessionId(null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoadingSessions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeDayId]);

  // 4. Active Session
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // 5. Load Messages, Bulletin, and Notes when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setBulletinItems([]);
      setNotes('');
      return;
    }

    if (activeSession) {
      setNotes(activeSession.notes || '');
    }

    let isMounted = true;
    Promise.all([
      traceApi.fetchTraceMessages(activeSessionId),
      traceApi.fetchTraceBulletin(activeSessionId),
    ])
      .then(([msgs, bulletins]) => {
        if (!isMounted) return;
        setMessages(msgs);
        setBulletinItems(bulletins);
      })
      .catch((err) => console.error('Error loading session details:', err));

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, activeSession]);

  // 6. Filtered Sessions for Sidebar
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter(
      (s) =>
        s.task_name.toLowerCase().includes(q) ||
        s.initial_prompt.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  // 7. Auto-save Notes (debounced 500ms) - Strictly NEVER injected into Gemini payload
  const handleSetNotes = useCallback(
    (newNotes: string) => {
      setNotes(newNotes);
      if (!activeSessionId) return;

      if (notesDebounceTimer.current) {
        clearTimeout(notesDebounceTimer.current);
      }

      notesDebounceTimer.current = setTimeout(async () => {
        try {
          await traceApi.updateTraceSession(activeSessionId, { notes: newNotes });
          setSessions((prev) =>
            prev.map((s) => (s.id === activeSessionId ? { ...s, notes: newNotes } : s))
          );
        } catch (err) {
          console.error('Failed to autosave notes:', err);
        }
      }, 500);
    },
    [activeSessionId]
  );

  // 8. Create Custom Day Folder (With any custom name)
  const handleCreateDay = useCallback(async (label: string) => {
    try {
      const created = await traceApi.createTraceDay(label);
      setDays((prev) => {
        const exists = prev.find((d) => d.id === created.id || d.day_label === created.day_label);
        if (exists) return prev;
        return [created, ...prev];
      });
      setActiveDayId(created.id);
      return created;
    } catch (err) {
      console.error('Failed to create day folder:', err);
      throw err;
    }
  }, []);

  // 9. Delete Entire Day
  const handleDeleteDay = useCallback(
    async (dayId: string) => {
      try {
        await traceApi.deleteTraceDay(dayId);
        setDays((prev) => prev.filter((d) => d.id !== dayId));
        if (activeDayId === dayId) {
          const remaining = days.filter((d) => d.id !== dayId);
          setActiveDayId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err) {
        console.error('Failed to delete day folder:', err);
      }
    },
    [activeDayId, days]
  );

  // 10. Export Day Tasks to JSON (Key-Value Dict or Full Array)
  const exportDayJson = useCallback(
    (targetDayId?: string) => {
      const dayId = targetDayId || activeDayId;
      const daySessions = sessions.filter((s) => s.day_id === dayId);
      const dict: Record<string, string> = {};
      daySessions.forEach((s) => {
        dict[s.task_name] = s.initial_prompt;
      });
      return JSON.stringify(dict, null, 2);
    },
    [activeDayId, sessions]
  );

  // 11. Single Session Creation
  const handleCreateSession = useCallback(
    async (taskName: string, initialPrompt: string) => {
      if (!activeDayId) throw new Error('No active day');
      const created = await traceApi.createTraceSession({
        day_id: activeDayId,
        task_name: taskName,
        initial_prompt: initialPrompt,
        status: 'warming',
      });
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      // Increment day session count
      setDays((prev) =>
        prev.map((d) =>
          d.id === activeDayId
            ? { ...d, session_count: (d.session_count || 0) + 1 }
            : d
        )
      );

      // Asynchronously warmup initial prompt with Gemini
      generateTurnPrompt({
        initialPrompt,
        messages: [],
      })
        .then(async (response) => {
          const assistantMsg = await traceApi.createTraceMessage(
            created.id,
            'assistant',
            response
          );
          // Also create first bulletin recommendation
          const bulletin = await traceApi.createTraceBulletinItem(
            created.id,
            response,
            0
          );
          await traceApi.updateTraceSession(created.id, { status: 'ready' });

          setSessions((prev) =>
            prev.map((s) => (s.id === created.id ? { ...s, status: 'ready' } : s))
          );
          setMessages((prev) =>
            activeSessionId === created.id ? [...prev, assistantMsg] : prev
          );
          setBulletinItems((prev) =>
            activeSessionId === created.id ? [...prev, bulletin] : prev
          );
        })
        .catch((err) => {
          console.error('Warmup error for single session:', err);
        });

      return created;
    },
    [activeDayId, activeSessionId]
  );

  // 10. Delete Session
  const handleDeleteSession = useCallback(
    async (id: string) => {
      await traceApi.deleteTraceSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      if (activeDayId) {
        setDays((prev) =>
          prev.map((d) =>
            d.id === activeDayId
              ? { ...d, session_count: Math.max(0, (d.session_count || 1) - 1) }
              : d
          )
        );
      }
    },
    [activeSessionId, sessions, activeDayId]
  );

  // 11. Update Session Status
  const handleUpdateSessionStatus = useCallback(
    async (id: string, status: TraceSessionStatus) => {
      await traceApi.updateTraceSession(id, { status });
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    },
    []
  );

  // 12. Send Turn Message (Chat Stream)
  const handleSendTurn = useCallback(
    async (userPrompt: string) => {
      if (!activeSession) return;
      try {
        setIsGeneratingTurn(true);

        // 1. Commit user message
        const userMsg = await traceApi.createTraceMessage(
          activeSession.id,
          'user',
          userPrompt
        );
        setMessages((prev) => [...prev, userMsg]);

        // 2. Generate Next Turn with Gemini using sliding window context
        const responseText = await generateTurnPrompt({
          initialPrompt: activeSession.initial_prompt,
          messages: [...messages, userMsg],
        });

        // 3. Commit assistant message
        const assistantMsg = await traceApi.createTraceMessage(
          activeSession.id,
          'assistant',
          responseText
        );
        setMessages((prev) => [...prev, assistantMsg]);

        // 4. Update session turns & status to 'active'
        const newTurns = (activeSession.turn_count || 0) + 1;
        await traceApi.updateTraceSession(activeSession.id, {
          turn_count: newTurns,
          status: 'active',
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? { ...s, turn_count: newTurns, status: 'active' }
              : s
          )
        );
      } catch (err) {
        console.error('Failed to generate turn:', err);
      } finally {
        setIsGeneratingTurn(false);
      }
    },
    [activeSession, messages]
  );

  // 13. Save to Bulletin Queue
  const handleSaveToBulletin = useCallback(
    async (promptText: string) => {
      if (!activeSessionId) return;
      const position = bulletinItems.length;
      const created = await traceApi.createTraceBulletinItem(
        activeSessionId,
        promptText,
        position
      );
      setBulletinItems((prev) => [...prev, created]);
    },
    [activeSessionId, bulletinItems]
  );

  // 14. Copy Bulletin Item
  const handleCopyBulletinItem = useCallback(
    async (item: TraceBulletinItem) => {
      await navigator.clipboard.writeText(item.prompt_text);
      if (!item.is_used) {
        await traceApi.updateTraceBulletinItem(item.id, { is_used: true });
        setBulletinItems((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, is_used: true } : b))
        );
        if (activeSession) {
          const nextTurns = (activeSession.turn_count || 0) + 1;
          await traceApi.updateTraceSession(activeSession.id, {
            turn_count: nextTurns,
            status: 'active',
          });
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSession.id
                ? { ...s, turn_count: nextTurns, status: 'active' }
                : s
            )
          );
        }
      }
    },
    [activeSession]
  );

  // 15. Update & Delete Bulletin Item
  const handleUpdateBulletinItem = useCallback(
    async (id: string, text: string) => {
      const updated = await traceApi.updateTraceBulletinItem(id, {
        prompt_text: text,
      });
      setBulletinItems((prev) => (prev.map((b) => (b.id === id ? updated : b))));
    },
    []
  );

  const handleDeleteBulletinItem = useCallback(async (id: string) => {
    await traceApi.deleteTraceBulletinItem(id);
    setBulletinItems((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // 16. Simultaneous Execution Engine: Batch Launcher
  const handleLaunchBatchTasks = useCallback(
    async (tasks: BatchTaskItem[], targetDayId?: string) => {
      const destinationDayId = targetDayId || activeDayId;
      if (!destinationDayId || tasks.length === 0) return;

      setBatchProgress({ active: true, completed: 0, total: tasks.length });

      // Step A: Immediately insert all parsed rows into trace_sessions with status='warming'
      const createdSessions: TraceSession[] = [];
      for (const t of tasks) {
        const sess = await traceApi.createTraceSession({
          day_id: destinationDayId,
          task_name: t.task_name,
          initial_prompt: t.prompt,
          status: 'warming',
        });
        createdSessions.push(sess);
      }

      // Show in sidebar right away if destination is active
      if (destinationDayId === activeDayId) {
        setSessions((prev) => [...createdSessions, ...prev]);
      }
      setDays((prev) =>
        prev.map((d) =>
          d.id === destinationDayId
            ? { ...d, session_count: (d.session_count || 0) + tasks.length }
            : d
        )
      );
      if (!activeSessionId && createdSessions.length > 0 && destinationDayId === activeDayId) {
        setActiveSessionId(createdSessions[0].id);
      }

      // Step B: Concurrency-controlled worker pool (max 5 concurrent calls)
      await runWithConcurrency(
        createdSessions,
        async (session) => {
          try {
            // 1. Send initial prompt to Gemini
            const assistantPrompt = await generateTurnPrompt({
              initialPrompt: session.initial_prompt,
              messages: [],
            });

            // 2. Save initial assistant response into trace_messages
            await traceApi.createTraceMessage(session.id, 'assistant', assistantPrompt);

            // 3. Save first follow-up turn prompt to bulletin queue
            await traceApi.createTraceBulletinItem(session.id, assistantPrompt, 0);

            // 4. Update session status = 'ready'
            await traceApi.updateTraceSession(session.id, { status: 'ready' });

            // Update UI state for that session
            setSessions((prev) =>
              prev.map((s) => (s.id === session.id ? { ...s, status: 'ready' } : s))
            );
          } catch (err) {
            console.error(`Error warming session ${session.task_name}:`, err);
            await traceApi.updateTraceSession(session.id, { status: 'ready' });
            setSessions((prev) =>
              prev.map((s) => (s.id === session.id ? { ...s, status: 'ready' } : s))
            );
          }
        },
        5, // Concurrency limit
        (completed, total) => {
          setBatchProgress({ active: true, completed, total });
        }
      );

      setBatchProgress({ active: false, completed: tasks.length, total: tasks.length });
    },
    [activeDayId, activeSessionId]
  );

  return (
    <TraceAssistContext.Provider
      value={{
        days,
        activeDayId,
        activeDay,
        setActiveDayId,
        createDay: handleCreateDay,
        deleteDay: handleDeleteDay,
        exportDayJson,
        sessions,
        filteredSessions,
        activeSessionId,
        activeSession,
        setActiveSessionId,
        createSession: handleCreateSession,
        deleteSession: handleDeleteSession,
        updateSessionStatus: handleUpdateSessionStatus,
        messages,
        isGeneratingTurn,
        sendTurnMessage: handleSendTurn,
        bulletinItems,
        saveToBulletin: handleSaveToBulletin,
        copyBulletinItem: handleCopyBulletinItem,
        updateBulletinItem: handleUpdateBulletinItem,
        deleteBulletinItem: handleDeleteBulletinItem,
        notes,
        setNotes: handleSetNotes,
        searchQuery,
        setSearchQuery,
        isBatchModalOpen,
        setIsBatchModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        batchProgress,
        launchBatchTasks: handleLaunchBatchTasks,
        isLoadingDays,
        isLoadingSessions,
        refreshDays: loadDays,
      }}
    >
      {children}
    </TraceAssistContext.Provider>
  );
};

export const useTraceAssist = () => {
  const context = useContext(TraceAssistContext);
  if (!context) {
    throw new Error('useTraceAssist must be used within TraceAssistProvider');
  }
  return context;
};
