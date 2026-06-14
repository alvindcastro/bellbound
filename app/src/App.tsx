import { useState, useEffect } from 'react';
import type { Block } from '@bellbound/engine';
import { resolveToday, resolveTierWorkout } from './services/todayService.js';
import type { TodayResult, ResolvedWorkout } from './services/todayService.js';
import { blockRepository } from './data/repositories/blockRepository.js';
import { workoutTemplateRepository } from './data/repositories/workoutTemplateRepository.js';
import TodayScreen from './ui/today/TodayScreen.js';
import LogForm from './ui/log/LogForm.js';
import RecentLogs from './ui/log/RecentLogs.js';

type AppView = 'today' | 'log' | 'recent';

export default function App() {
  const today = new Date().toISOString().slice(0, 10);
  const [view, setView] = useState<AppView>('today');
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [resolvedWorkout, setResolvedWorkout] = useState<ResolvedWorkout | null>(null);

  useEffect(() => {
    Promise.all([
      resolveToday(today),
      blockRepository.getActiveBlock(),
      workoutTemplateRepository.getById('dkbs'),
    ]).then(([result, block, template]) => {
      setTodayResult(result);
      setActiveBlock(block);
      if (block && template) {
        setResolvedWorkout(resolveTierWorkout(template, block.baselineTier));
      }
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
            onSave={() => setView('today')}
            onCancel={() => setView('today')}
          />
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
      </header>
      <main>
        <TodayScreen
          date={today}
          todayResult={todayResult}
          onLogWorkout={() => setView('log')}
        />
      </main>
    </div>
  );
}
