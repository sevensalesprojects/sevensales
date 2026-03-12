import { useEffect, useCallback } from "react";

type ShortcutHandlers = Record<string, () => void>;

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Don't trigger on modifier keys
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
