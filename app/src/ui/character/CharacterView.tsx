import { useState, useEffect } from 'react';
import type { Character } from '@bellbound/engine';
import { getCharacterClass, CHARACTER_CLASSES } from '@bellbound/engine';
import { characterRepository } from '../../data/repositories/characterRepository.js';

export default function CharacterView() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    characterRepository.getPlayer().then(c => {
      setCharacter(c);
      setLoading(false);
    });
  }, []);

  async function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!character) return;
    const newId = e.target.value;
    await characterRepository.updateClass(character.userId, newId);
    setCharacter({ ...character, className: newId });
  }

  if (loading) return <p className="loading">Loading…</p>;
  if (!character) return <p className="loading">Character not found.</p>;

  const cls = getCharacterClass(character.className);

  return (
    <div>
      <h2 className="section-title">{character.characterName}</h2>
      <p>
        <label>Class: </label>
        <select value={character.className} onChange={handleClassChange}>
          {CHARACTER_CLASSES.map(c => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </select>
      </p>
      <p className="flavour-message">{cls.flavourMessage}</p>
      <section>
        <h3>Stats</h3>
        <ul>
          <li>Strength: {character.stats.strength}</li>
          <li>Conditioning: {character.stats.conditioning}</li>
          <li>Control: {character.stats.control}</li>
          <li>Consistency: {character.stats.consistency}</li>
          <li>Recovery: {character.stats.recovery}</li>
          <li>Judgment: {character.stats.judgment}</li>
        </ul>
      </section>
    </div>
  );
}
