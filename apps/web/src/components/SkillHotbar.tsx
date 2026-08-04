import { useState, useEffect } from 'react';
import { useGameEvent, useGameCommand } from '../hooks/useGameEvents';
import { PhaserEvents, ReactCommands } from '../game/core/GameEvents';

const SKILL_SLOTS = [
  { key: 'Q', id: 'skill_q' },
  { key: 'E', id: 'skill_e' },
  { key: 'A', id: 'skill_a' },
  { key: 'J', id: 'skill_j' },
];

interface SkillState {
  id: string;
  key: string;
  name: string;
  icon: string;
  cooldown: number;
  ready: boolean;
}

const DEFAULT_SKILLS: SkillState[] = SKILL_SLOTS.map(s => ({
  id: s.id,
  key: s.key,
  name: '',
  icon: '✦',
  cooldown: 0,
  ready: true,
}));

export function SkillHotbar() {
  const [skills, setSkills] = useState<SkillState[]>(DEFAULT_SKILLS);
  const send = useGameCommand();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasCooldown = skills.some(s => s.cooldown > 0);
    if (!hasCooldown) return;
    const interval = setInterval(() => {
      setSkills(prev =>
        prev.map(s => {
          if (s.cooldown <= 0) return s;
          const newCd = Math.max(0, s.cooldown - 0.2);
          return { ...s, cooldown: newCd, ready: newCd <= 0 };
        })
      );
    }, 200);
    return () => clearInterval(interval);
  }, [tick]);

  useGameEvent(PhaserEvents.SKILL_READY, (data: unknown) => {
    const skillId = (data as any)?.skillId;
    if (skillId) {
      setSkills(prev =>
        prev.map(s => s.id === skillId ? { ...s, cooldown: 0, ready: true } : s)
      );
    }
  });

  const handleCast = (skill: SkillState) => {
    if (!skill.ready) return;
    send(ReactCommands.CAST_SKILL, { skillId: skill.id });
  };

  return (
    <div className="skill-hotbar">
      {skills.map(skill => {
        const cdSec = Math.ceil(skill.cooldown);
        return (
          <button
            key={skill.id}
            type="button"
            className={`skill-slot${skill.ready ? '' : ' skill-slot-cd'}`}
            onClick={() => handleCast(skill)}
            disabled={!skill.ready}
            title={`${skill.key}: ${skill.name || 'Skill'}${!skill.ready ? ` (${cdSec}s)` : ''}`}
          >
            <span className="skill-slot-icon">{skill.icon}</span>
            <span className="skill-slot-key">{skill.key}</span>
            {cdSec > 0 && (
              <span className="skill-slot-cd">{cdSec}s</span>
            )}
          </button>
        );
      })}
    </div>
  );
}