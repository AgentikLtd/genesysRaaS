/**
 * History Hook for Undo/Redo functionality
 * Manages state history for the visual rule editor
 */

import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  clearHistory: () => void;
}

/**
 * Custom hook for managing undo/redo history
 */
export const useHistory = (
  maxHistorySize: number = 50
): UseHistoryReturn => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isInternalUpdate = useRef(false);

  /**
   * Push a new state to history
   */
  const pushState = useCallback((nodes: Node[], edges: Edge[]) => {
    // Don't push if this is an internal update from undo/redo
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      timestamp: Date.now()
    };

    setHistory((prev) => {
      // Remove any states after current index (for redo)
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(newHistory.length - maxHistorySize);
      }
      
      return newHistory;
    });

    setCurrentIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
  }, [currentIndex, maxHistorySize]);

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isInternalUpdate.current = true;
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isInternalUpdate.current = true;
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, history.length]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  /**
   * Get current state from history
   */
  const getCurrentState = useCallback((): HistoryState | null => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  return {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    undo,
    redo,
    pushState,
    clearHistory
  };
};

export default useHistory;