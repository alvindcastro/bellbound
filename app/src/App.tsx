import { useState, useEffect } from 'react';
import type { Block, WorkoutLog, ResolvedWorkout, Recommendation, StatusEffect, ChallengePath } from '@bellbound/engine';
import { resolveWorkoutAtTier, CHALLENGE_PATH_DEFINITIONS } from '@bellbound/engine';
import { getRecommendationForTemplate } from './services/councilService.js';
import { resolveToday } from './services/todayService.js';
import type { TodayResult } from './services/todayService.js';
import { blockRepository } from './data/repositories/blockRepository.js';
import { workoutTemplateRepository } from './data/repositories/workoutTemplateRepository.js';
import { workoutLogRepository } from './data/repositories/workoutLogRepository.js';
import { statusEffectRepository } from './data/repositories/statusEffectRepository.js';
import { createAndPersistEffectsFromLog } from './services/effectService.js';
import { applyStatGainsFromLog } from './services/statService.js';
import { evaluateAndPersistQuests } from './services/questService.js';
import TodayScreen from './ui/today/TodayScreen.js';
import LogForm from './ui/log/LogForm.js';
import TestWorkoutForm from './ui/log/TestWorkoutForm.js';
import AscensionScreen from './ui/ascension/AscensionScreen.js';
import FreeDayForm from './ui/log/FreeDayForm.js';
import RecentLogs from './ui/log/RecentLogs.js';
import WeeklyHistory from './ui/history/WeeklyHistory.js';
import WeeklyReportScreen from './ui/review/WeeklyReportScreen.js';
import CharacterView from './ui/character/CharacterView.js';
import DailyContextForm from './ui/daily/DailyContextForm.js';
import QuestsView from './ui/quests/QuestsView.js';
import { evaluateAndApplyAscension, type AscensionOutcome } from './services/ascensionService.js';
import { generateAndStoreLore } from './services/loreService.js';
import { getAiClient } from './data/ai/index.js';

type AppView = 'today' | 'log' | 'test' | 'ascension' | 'activity' | 'recent' | 'history' | 'review' | 'character' | 'daily' | 'quests';

function AppShell({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Bellbound</span>
        {nav}
      </header>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const today = new Date().toISOString().slice(0, 10);
  const [view, setView] = useState<AppView>('today');
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [resolvedWorkout, setResolvedWorkout] = useState<ResolvedWorkout | null>(null);
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [activeEffects, setActiveEffects] = useState<StatusEffect[]>([]);
  const [ascensionOutcome, setAscensionOutcome] = useState<AscensionOutcome | null>(null);

  async function loadActiveEffects() {
    // UI shows stored effects; expiry evaluation is handled in councilService
    const effects = await statusEffectRepository.listAll();
    setActiveEffects(effects);
  }

  useEffect(() => {
    Promise.all([
      resolveToday(today),
      blockRepository.getActiveBlock(),
      workoutTemplateRepository.getById('dkbs'),
      workoutLogRepository.getByDate(today),
      statusEffectRepository.listAll(),
    ]).then(([result, block, template, log, effects]) => {
      setTodayResult(result);
      setActiveBlock(block);
      if (block && template) {
        setResolvedWorkout(resolveWorkoutAtTier(template, block.baselineTier));
      }
      setTodayLog(log);
      setActiveEffects(effects);
    });
  }, [today]);

  if (view === 'test' && activeBlock && resolvedWorkout) {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>Cancel</button>}>
        <TestWorkoutForm
          date={today}
          blockId={activeBlock.id}
          workout={resolvedWorkout}
          sessionsCompleted={activeBlock.completedPlannedKbSessions}
          sessionsNeeded={activeBlock.testGuardMinSessions}
          onSave={async (log) => {
            const outcome = await evaluateAndApplyAscension(activeBlock, log, today);
            setAscensionOutcome(outcome);
            const newBlock = await blockRepository.getActiveBlock();
            setActiveBlock(newBlock);
            if (newBlock) {
              const template = await workoutTemplateRepository.getById('dkbs');
              if (template) setResolvedWorkout(resolveWorkoutAtTier(template, newBlock.baselineTier));
            }
            const log2 = await workoutLogRepository.getByDate(today);
            setTodayLog(log2);
            setView('ascension');
          }}
          onCancel={() => setView('today')}
        />
      </AppShell>
    );
  }

  if (view === 'ascension' && ascensionOutcome) {
    return (
      <AppShell nav={null}>
        <AscensionScreen
          outcome={ascensionOutcome}
          onComplete={async (selectedPath: ChallengePath | null) => {
            if (ascensionOutcome.kind === 'ascended' && selectedPath !== null) {
              const newBlock = await blockRepository.getActiveBlock();
              if (newBlock) {
                await blockRepository.setChallengePath(newBlock.id, selectedPath);
                setActiveBlock({ ...newBlock, challengePath: selectedPath });
              }
            }
            setAscensionOutcome(null);
            setView('today');
          }}
        />
      </AppShell>
    );
  }

  if (view === 'log' && resolvedWorkout && activeBlock && todayResult) {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>Cancel</button>}>
        <LogForm
          date={today}
          blockId={activeBlock.id}
          workout={resolvedWorkout}
          plannedDayType={todayResult.dayType}
          onSave={async () => {
            const log = await workoutLogRepository.getByDate(today);
            setTodayLog(log);
            if (log) {
              await createAndPersistEffectsFromLog(log);
              await applyStatGainsFromLog(log);
              await evaluateAndPersistQuests(today);
              await generateAndStoreLore(log, getAiClient({ online: typeof navigator !== 'undefined' ? navigator.onLine : false }));
            }
            await loadActiveEffects();
            if (resolvedWorkout) {
              const rec = await getRecommendationForTemplate(resolvedWorkout.templateId);
              setRecommendation(rec);
            }
            setView('today');
          }}
          onCancel={() => setView('today')}
        />
      </AppShell>
    );
  }

  if (view === 'activity') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>Cancel</button>}>
        <FreeDayForm
          date={today}
          blockId={activeBlock?.id ?? 'no-block'}
          onSave={async () => {
            const log = await workoutLogRepository.getByDate(today);
            setTodayLog(log);
            if (log) {
              await createAndPersistEffectsFromLog(log);
              await applyStatGainsFromLog(log);
              await evaluateAndPersistQuests(today);
            }
            setView('today');
          }}
          onCancel={() => setView('today')}
        />
      </AppShell>
    );
  }

  if (view === 'daily') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>Cancel</button>}>
        <DailyContextForm
          date={today}
          onSave={async () => {
            await loadActiveEffects();
            setView('today');
          }}
          onCancel={() => setView('today')}
        />
      </AppShell>
    );
  }

  if (view === 'character') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>← Today</button>}>
        <CharacterView />
      </AppShell>
    );
  }

  if (view === 'history') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>← Today</button>}>
        <WeeklyHistory />
      </AppShell>
    );
  }

  if (view === 'review') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>← Today</button>}>
        <WeeklyReportScreen today={today} />
      </AppShell>
    );
  }

  if (view === 'recent') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>← Today</button>}>
        <h2 className="section-title">Recent Logs</h2>
        <RecentLogs />
      </AppShell>
    );
  }

  if (view === 'quests') {
    return (
      <AppShell nav={<button onClick={() => setView('today')}>← Today</button>}>
        <QuestsView />
      </AppShell>
    );
  }

  return (
    <AppShell nav={<>
      <button onClick={() => setView('daily')}>Daily</button>
      <button onClick={() => setView('recent')}>Log History</button>
      <button onClick={() => setView('history')}>Week</button>
      <button onClick={() => setView('review')}>Report</button>
      <button onClick={() => setView('character')}>Character</button>
      <button onClick={() => setView('quests')}>Quests</button>
    </>}>
      <TodayScreen
        date={today}
        todayResult={todayResult}
        todayLog={todayLog}
        recommendation={recommendation}
        activeEffects={activeEffects}
        challengePathName={
          activeBlock?.challengePath
            ? CHALLENGE_PATH_DEFINITIONS.find(d => d.id === activeBlock.challengePath)?.name
            : undefined
        }
        onLogWorkout={() => setView('log')}
        onLogActivity={() => setView('activity')}
        onAttemptTest={() => setView('test')}
      />
    </AppShell>
  );
}
