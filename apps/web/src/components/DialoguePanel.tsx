import { useCurrentDialogue, useGameCommand } from '../hooks/useGameEvents';
import { ReactCommands } from '../game/core/GameEvents';

interface DialogueOptionData {
  id?: string;
  value?: string;
  text?: string;
  label?: string;
  name?: string;
}

interface DialogueData {
  id?: string;
  npcName?: string;
  name?: string;
  text?: string;
  message?: string;
  options?: DialogueOptionData[];
  choices?: DialogueOptionData[];
}

function getNpcName(dialogue: DialogueData): string {
  return dialogue.npcName || dialogue.name || 'NPC';
}

function getDialogueText(dialogue: DialogueData): string {
  return dialogue.text || dialogue.message || '';
}

function getDialogueOptions(dialogue: DialogueData): DialogueOptionData[] {
  const opts = dialogue.options || dialogue.choices;
  if (Array.isArray(opts)) return opts;
  return [];
}

function getOptionText(opt: DialogueOptionData): string {
  return opt.text || opt.label || opt.name || '';
}

export function DialoguePanel() {
  const dialogue = useCurrentDialogue() as DialogueData | null;
  const send = useGameCommand();

  if (!dialogue) return null;

  const options = getDialogueOptions(dialogue);

  const handleOption = (opt: DialogueOptionData) => {
    send(ReactCommands.DIALOG_OPTION, {
      dialogueId: dialogue.id,
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
          {options.map((opt) => (
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