import { useCallback, useEffect, useRef, useState } from 'react';
import { micInput } from '@/audio/engine/mic';
import { TakeRecorder } from '@/audio/engine/recorder';
import { takeNote, type TakeNote } from '@/core/take';
import type { KeyContext } from '@/core/types';
import { useMusicStore } from '@/store/useMusicStore';

export interface Take {
  id: string;
  url: string;
  blob: Blob;
  duration: number;
  createdAt: number;
  key: KeyContext;
  notes: TakeNote[];
}

/** Gravações guardadas na sessão (as mais antigas saem). */
export const MAX_TAKES = 5;
/** Gravação para sozinha depois disso. */
export const MAX_TAKE_SECONDS = 180;

/**
 * Grava o microfone e, junto, as notas detectadas (com o acorde de cada momento).
 * As gravações ficam só na memória desta sessão; o usuário pode baixar cada uma.
 */
export function useTakes() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [recordingSince, setRecordingSince] = useState<number | null>(null);
  const recorder = useRef(new TakeRecorder());
  const notes = useRef<TakeNote[]>([]);
  const startedAt = useRef(0);
  const unsub = useRef<(() => void) | null>(null);
  const limit = useRef(0);

  const stop = useCallback(async () => {
    window.clearTimeout(limit.current);
    unsub.current?.();
    unsub.current = null;
    if (!recorder.current.recording) return;
    const blob = await recorder.current.stop();
    const duration = (performance.now() - startedAt.current) / 1000;
    setRecordingSince(null);
    const take: Take = {
      id: `take-${Date.now().toString(36)}`,
      url: URL.createObjectURL(blob),
      blob,
      duration,
      createdAt: Date.now(),
      key: useMusicStore.getState().key,
      notes: notes.current,
    };
    setTakes((list) => {
      const next = [take, ...list];
      next.slice(MAX_TAKES).forEach((t) => URL.revokeObjectURL(t.url));
      return next.slice(0, MAX_TAKES);
    });
  }, []);

  const start = useCallback(() => {
    const stream = micInput.mediaStream;
    if (!stream || recorder.current.recording) return;
    notes.current = [];
    startedAt.current = performance.now();
    recorder.current.start(stream);
    setRecordingSince(Date.now());
    // Cada nota registrada (microfone ou toque) entra na linha do tempo da gravação.
    unsub.current = useMusicStore.subscribe((s, prev) => {
      if (s.lastNotes === prev.lastNotes || s.lastNotes.length === 0) return;
      const midi = s.lastNotes.at(-1)!;
      const t = (performance.now() - startedAt.current) / 1000;
      notes.current.push(takeNote(t, midi, s.key, s.currentChord, s.settings.arpeggio));
    });
    limit.current = window.setTimeout(() => void stop(), MAX_TAKE_SECONDS * 1000);
  }, [stop]);

  const remove = useCallback((id: string) => {
    setTakes((list) => {
      list.filter((t) => t.id === id).forEach((t) => URL.revokeObjectURL(t.url));
      return list.filter((t) => t.id !== id);
    });
  }, []);

  // O microfone desligou no meio: fecha a gravação.
  const micOn = useMusicStore((s) => s.mic.status === 'on');
  useEffect(() => {
    if (!micOn && recorder.current.recording) void stop();
  }, [micOn, stop]);

  useEffect(
    () => () => {
      unsub.current?.();
      window.clearTimeout(limit.current);
    },
    [],
  );

  return { takes, recordingSince, start, stop, remove };
}
