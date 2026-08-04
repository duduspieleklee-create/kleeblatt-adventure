import { useActiveQuests } from '../hooks/useGameEvents';

interface QuestObject {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  desc?: string;
  progress?: number;
  current?: number;
  total?: number;
  required?: number;
  progressText?: string;
  type?: string;
  rewards?: { xp?: number; gold?: number; items?: string | number } | string | string[];
}

function getQuestTitle(q: QuestObject): string {
  return q.title || q.name || 'Unbenannte Quest';
}

function getQuestDesc(q: QuestObject): string {
  return q.description || q.desc || '';
}

function getQuestProgress(q: QuestObject): { current: number; total: number; text?: string } {
  const current = q.progress ?? q.current ?? 0;
  const total = q.total ?? q.required ?? 1;
  const text = q.progressText;
  return { current, total, text: text || `${current}/${total}` };
}

function getQuestRewards(q: QuestObject): string {
  const rewards = q.rewards;
  if (!rewards) return '';
  if (typeof rewards === 'string') return rewards;
  if (Array.isArray(rewards)) return rewards.join(', ');
  const parts: string[] = [];
  if (rewards.xp) parts.push(`${rewards.xp} XP`);
  if (rewards.gold) parts.push(`${rewards.gold} Gold`);
  if (rewards.items) parts.push(`${rewards.items} Items`);
  return parts.join(', ');
}

function getQuestIcon(q: QuestObject): string {
  const type = q.type;
  switch (type) {
    case 'collect': return '📦';
    case 'kill': return '⚔';
    case 'explore': return '🗺';
    case 'craft': return '🔨';
    case 'social': return '💬';
    default: return '📜';
  }
}

export function QuestPanel() {
  const quests = useActiveQuests();

  if (!quests.length) {
    return (
      <div className="quest-panel card">
        <h2>Quests</h2>
        <p className="quest-panel-empty">Keine aktiven Quests</p>
      </div>
    );
  }

  return (
    <div className="quest-panel card">
      <h2>Quests</h2>
      <div className="quest-list">
        {quests.map((q, i) => {
          const qo = q as QuestObject;
          const { current, total, text } = getQuestProgress(qo);
          const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
          return (
            <div key={qo.id ?? `quest-${i}`} className="quest-item">
              <div className="quest-header">
                <span className="quest-icon">{getQuestIcon(qo)}</span>
                <span className="quest-title">{getQuestTitle(qo)}</span>
              </div>
              {getQuestDesc(qo) && (
                <p className="quest-desc">{getQuestDesc(qo)}</p>
              )}
              <div className="quest-progress-wrap">
                <div className="quest-progress-bar">
                  <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="quest-progress-text">{text}</span>
              </div>
              {getQuestRewards(qo) && (
                <span className="quest-rewards">Belohnung: {getQuestRewards(qo)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}