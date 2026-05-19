'use client';

import React, { useState } from 'react';
import type { FieldFlag } from './field-flag.types.js';

interface FieldFlagPanelProps {
  existingFlag: FieldFlag | undefined;
  onFlag: (note?: string) => void;
  onUnflag: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function FieldFlagPanel({ existingFlag, onFlag, onUnflag, onClose, loading }: FieldFlagPanelProps) {
  const [note, setNote] = useState(existingFlag?.note ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onFlag(note.trim() || undefined);
    onClose();
  }

  return (
    <div className="mt-1 p-3 border border-destructive/40 rounded-md bg-destructive/5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-destructive">Red Flag</span>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground leading-none">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="w-full text-sm border rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-destructive"
          rows={2}
          placeholder="Optional note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={5000}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
          >
            {existingFlag ? 'Update flag' : 'Flag'}
          </button>
          {existingFlag && (
            <button
              type="button"
              disabled={loading}
              onClick={() => { onUnflag(); onClose(); }}
              className="text-xs px-3 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Remove flag
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
