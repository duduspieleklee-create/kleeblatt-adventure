// Minimal typed gameBridge used by the web app components.
// This provides a lightweight in-memory event bus with simple on/emit semantics
// matching the usage in InventoryScreen.tsx (on returns an unsubscribe function).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (data?: any) => void;

class GameBridge {
  private listeners: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
      if (set!.size === 0) this.listeners.delete(event);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, data?: any): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copy to array to avoid issues if handlers remove themselves while iterating
    for (const handler of Array.from(set)) {
      try {
        handler(data);
      } catch (err) {
        // Keep build/runtime resilient — don't throw from event handlers
        // eslint-disable-next-line no-console
        console.error('[gameBridge] handler error for', event, err);
      }
    }
  }
}

export const gameBridge = new GameBridge();
