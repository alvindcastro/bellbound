import { useState, useEffect } from 'react';
import { QUEST_DEFINITIONS } from '@bellbound/engine';
import { getQuestDisplayState } from '../../services/questService.js';
import { rewardRepository } from '../../data/repositories/rewardRepository.js';
import type { ItemRow, TitleRow } from '../../data/db/bellboundDb.js';

type QuestEntry = {
  definition: typeof QUEST_DEFINITIONS[number];
  progress: number;
  completed: boolean;
};

export default function QuestsView() {
  const [quests, setQuests] = useState<QuestEntry[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getQuestDisplayState(),
      rewardRepository.listItems(),
      rewardRepository.listTitles(),
    ]).then(([q, i, t]) => {
      setQuests(q);
      setItems(i);
      setTitles(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="loading">Loading...</p>;

  return (
    <div>
      <h2 className="section-title">Quests</h2>
      <ul>
        {quests.map(({ definition: def, progress, completed }) => (
          <li key={def.id}>
            <strong>{def.name}</strong>
            {completed ? ' — Complete' : ` — ${progress} / ${def.required}`}
            <div>{def.objective}</div>
            {completed && <div>Reward: {def.reward.name}</div>}
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <section>
          <h3>Items</h3>
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <strong>{item.name}</strong> — {item.flavourText}
              </li>
            ))}
          </ul>
        </section>
      )}

      {titles.length > 0 && (
        <section>
          <h3>Titles</h3>
          <ul>
            {titles.map(title => (
              <li key={title.id}>
                <strong>{title.name}</strong> — {title.flavourText}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
