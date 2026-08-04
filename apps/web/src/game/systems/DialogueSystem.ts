import { gameBridge } from '../../lib/gameBridge';
import { PhaserEvents } from '../core/GameEvents';

export interface DialogueOption {
  id: string;
  text: string;
  next?: string;
  close?: boolean;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  options: DialogueOption[];
}

export interface DialogueData {
  npcId: string;
  lines: DialogueLine[];
  startLine: string;
}

export default class DialogueSystem {
  public currentDialogue: DialogueData | null = null;
  public currentNpcId: string = '';
  private currentLineId: string = '';

  constructor(_scene: Phaser.Scene) {
  }

  startDialogue(npcId: string, dialogueData: DialogueData): boolean {
    this.currentDialogue = dialogueData;
    this.currentNpcId = npcId;
    this.currentLineId = dialogueData.startLine;

    const startLine = dialogueData.lines.find(l => l.id === dialogueData.startLine);

    gameBridge.emit(PhaserEvents.DIALOG_START, {
      npcId,
      speaker: startLine?.speaker,
      text: startLine?.text,
      options: startLine?.options,
    });

    return true;
  }

  selectOption(optionId: string): boolean {
    if (!this.currentDialogue) return false;

    const currentLine = this.currentDialogue.lines.find(l => l.id === this.currentLineId);
    if (!currentLine) return false;

    const option = currentLine.options.find(o => o.id === optionId);
    if (!option) return false;

    gameBridge.emit(PhaserEvents.DIALOG_OPTION, {
      npcId: this.currentNpcId,
      optionId,
      text: option.text,
    });

    if (option.close) {
      this.closeDialogue();
      return true;
    }

    if (option.next) {
      const nextLine = this.currentDialogue.lines.find(l => l.id === option.next);
      if (nextLine) {
        this.currentLineId = nextLine.id;

        gameBridge.emit(PhaserEvents.DIALOG_START, {
          npcId: this.currentNpcId,
          speaker: nextLine.speaker,
          text: nextLine.text,
          options: nextLine.options,
        });
      }
    }

    return true;
  }

  closeDialogue(): void {
    this.currentDialogue = null;
    this.currentNpcId = '';
    this.currentLineId = '';
  }

  getCurrentLine(): DialogueLine | null {
    if (!this.currentDialogue) return null;
    return this.currentDialogue.lines.find(l => l.id === this.currentLineId) || null;
  }
}