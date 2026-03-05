import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

export default function useUndoRedo() {
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const pushState = useCallback((snapshot) => {
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
    futureRef.current = [];
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return null;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    return prev;
  }, []);

  const markUndone = useCallback((currentSnapshot) => {
    futureRef.current = [...futureRef.current, currentSnapshot];
    updateFlags();
  }, [updateFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    return next;
  }, []);

  const markRedone = useCallback((currentSnapshot) => {
    historyRef.current = [...historyRef.current, currentSnapshot];
    updateFlags();
  }, [updateFlags]);

  return { pushState, undo, redo, markUndone, markRedone, canUndo, canRedo };
}
