import { afterEach, describe, expect, it } from 'vitest';
import { toast, useToasts } from '../toast';

afterEach(() => useToasts.getState().toasts.forEach((t) => useToasts.getState().dismiss(t.id)));

describe('avisos', () => {
  it('o mesmo aviso repetido não empilha cópias', () => {
    toast.error('Não foi possível sincronizar.');
    toast.success('Progressão salva.');
    toast.info('Não foi possível sincronizar.');
    const { toasts } = useToasts.getState();
    expect(toasts.map((t) => t.message)).toEqual([
      'Progressão salva.',
      'Não foi possível sincronizar.',
    ]);
    expect(toasts.at(-1)!.kind).toBe('info');
  });
});
