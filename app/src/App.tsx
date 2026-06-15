import { useState, useEffect } from 'react';
import type { Block, WorkoutLog } from '@bellbound/engine';
import { resolveToday, resolveTierWorkout } from './services/todayService.js';
import type { TodayResult, ResolvedWorkout } from './services/todayService.js';
import { blockRepository } from './data/repositories/blockRepository.js';
import { workoutTemplateRepository } from './data/repositories/workoutTemplateRepository.js';
import { workoutLogRepository } from './data/repositories/workoutLogRepository.js';
import TodayScreen from './ui/today/TodayScreen.js';
import LogForm from './ui/log/LogForm.js';
import RecentLogs from './ui/log/RecentLogs.js';
import WeeklyHistory from './ui/history/WeeklyHistory.js';

type AppView = 'today' | 'log' | 'recent' | 'history';

export default function App() {
  const today = new Date().toISOString().slice(0, 10);
  const [view, setView] = useState<AppView>('today');
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [resolvedWorkout, setResolvedWorkout] = useState<ResolvedWorkout | null>(null);
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null);

  useEffect(() => {
    Promise.all([
      resolveToday(today),
      blockRepository.getActiveBlock(),
      workoutTemplateRepository.getById('dkbs'),
      workoutLogRepository.getByDate(today),
    ]).then(([result, block, template, log]) => {
      setTodayResult(result);
      setActiveBlock(block);
      if (block && template) {
        setResolvedWorkout(resolveTierWorkout(template, block.baselineTier));
      }
      setTodayLog(log);
    });
  }, [today]);

  if (view === 'log' && resolvedWorkout && activeBlock && todayResult) {
    return (
      <div className="app">
        <header className="app-header">
          <span className="app-title">Bellbound</span>
          <button onClick={() => setView('today')}>Cancel</button>
        </header>
        <main>
          <LogForm
            date={today}
            blockId={activeBlock.id}
            workout={resolvedWorkout}
            plannedDayType={todayResult.dayType}
            onSave={async () => {
              const log = await workoutLogRepository.getByDate(today);
              setTodayLog(log);
              setView('today');
            }}
            onCancel={() => setView('today')}
          />
        </main>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="app">
        <header className="app-header">
          <span className="app-title">Bellbound</span>
          <button onClick={() => setView('today')}>← Today</button>
        </header>
        <main>
          <WeeklyHistory />
        </main>
      </div>
    );
  }

  if (view === 'recent') {
    return (
      <div className="app">
        <header className="app-header">
          <span className="app-title">Bellbound</span>
          <button onClick={() => setView('today')}>← Today</button>
        </header>
        <main>
          <h2 className="section-title">Recent Logs</h2>
          <RecentLogs />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Bellbound</span>
        <button onClick={() => setView('recent')}>Log History</button>
        <button onClick={() => setView('history')}>Week</button>
      </header>
      <main>
        <TodayScreen
          date={today}
          todayResult={todayResult}
          todayLog={todayLog}
          onLogWorkout={() => setView('log')}
        />
      </main>
    </div>
  );
}
