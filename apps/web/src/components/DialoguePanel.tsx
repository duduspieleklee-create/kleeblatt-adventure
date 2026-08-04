import { useCurrentDialogue, useGameCommand } from '../hooks/useGameEvents';
import { ReactCommands } from '../game/core/GameEvents';

function getNpcName(dialogue: unknown): string {
  return (dialogue as any)?.npcName || (dialogue as any)?.name || 'NPC';
}

function getDialogueText(dialogue: unknown): string {
  return (dialogue as any)?.text || (dialogue as any)?.message || '';
}

function getDialogueOptions(dialogue: unknown): any[] {
  const opts = (dialogue as any)?.options || (dialogue as any)?.choices;
  if (Array.isArray(opts)) return opts;
  return [];
}

function getOptionText(opt: unknown): string {
  return (opt as any)?.text || (opt as any)?.label || (opt as any)?.name || '';
}

export function DialoguePanel() {
  const dialogue = useCurrentDialogue();
  const send = useGameCommand();

  if (!dialogue) return null;

  const options = getDialogueOptions(dialogue);

  const handleOption = (opt: any) => {
    send(ReactCommands.DIALOG_OPTION, {
      dialogueId: (dialogue as any)?.id,
      optionId: opt.id ?? opt.value,
      text: getOptionText(opt),
    });
  };

  const handleClose = () => {
    send(ReactCommands.DIALOG_CLOSE);
  };

  return (
    <div className="dialogue-panel">
      <div className="dialogue-npc-bar">
        <span className="dialogue-npc-name">{getNpcName(dialogue)}</span>
        <button type="button" className="dialogue-close-btn" onClick={handleClose}>✕</button>
      </div>
      <div className="dialogue-text">
        {getDialogueText(dialogue)}
      </div>
      {options.length > 0 && (
        <div className="dialogue-options">
          {options.map((opt: any) => (
            <button
              key={opt.id ?? opt.value}
              type="button"
              className="btn dialogue-option-btn"
              onClick={() => handleOption(opt)}
            >
              {getOptionText(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}