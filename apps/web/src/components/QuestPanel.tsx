import { useActiveQuests } from '../hooks/useGameEvents';

function getQuestTitle(q: unknown): string {
  return (q as any)?.title || (q as any)?.name || 'Unbenannte Quest';
}

function getQuestDesc(q: unknown): string {
  return (q as any)?.description || (q as any)?.desc || '';
}

function getQuestProgress(q: unknown): { current: number; total: number; text?: string } {
  const current = (q as any)?.progress ?? (q as any)?.current ?? 0;
  const total = (q as any)?.total ?? (q as any)?.required ?? 1;
  const text = (q as any)?.progressText;
  return { current, total, text: text || `${current}/${total}` };
}

function getQuestRewards(q: unknown): string {
  const rewards = (q as any)?.rewards;
  if (!rewards) return '';
  if (typeof rewards === 'string') return rewards;
  if (Array.isArray(rewards)) return rewards.join(', ');
  const parts: string[] = [];
  if ((rewards as any)?.xp) parts.push(`${(rewards as any).xp} XP`);
  if ((rewards as any)?.gold) parts.push(`${(rewards as any).gold} Gold`);
  if ((rewards as any)?.items) parts.push(`${(rewards as any).items} Items`);
  return parts.join(', ');
}

function getQuestIcon(q: unknown): string {
  const type = (q as any)?.type;
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
          const { current, total, text } = getQuestProgress(q);
          const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
          return (
            <div key={(q as any)?.id ?? i} className="quest-item">
              <div className="quest-header">
                <span className="quest-icon">{getQuestIcon(q)}</span>
                <span className="quest-title">{getQuestTitle(q)}</span>
              </div>
              {getQuestDesc(q) && (
                <p className="quest-desc">{getQuestDesc(q)}</p>
              )}
              <div className="quest-progress-wrap">
                <div className="quest-progress-bar">
                  <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="quest-progress-text">{text}</span>
              </div>
              {getQuestRewards(q) && (
                <span className="quest-rewards">Belohnung: {getQuestRewards(q)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}