import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWakeLock } from '../useWakeLock';

class FakeSentinel extends EventTarget {
  released = false;
  release = vi.fn(async () => {
    this.released = true;
    this.dispatchEvent(new Event('release'));
  });
}

let sentinels: FakeSentinel[];
const request = vi.fn(async () => {
  const s = new FakeSentinel();
  sentinels.push(s);
  return s;
});

const flush = () => act(async () => await Promise.resolve());

describe('useWakeLock', () => {
  beforeEach(() => {
    sentinels = [];
    request.mockClear();
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('pede a trava ao ativar e solta ao desativar', async () => {
    const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } });
    await flush();
    expect(request).toHaveBeenCalledWith('screen');
    rerender({ on: false });
    await flush();
    expect(sentinels[0]!.release).toHaveBeenCalled();
  });

  it('não pede nada enquanto inativo', async () => {
    renderHook(() => useWakeLock(false));
    await flush();
    expect(request).not.toHaveBeenCalled();
  });

  it('pede de novo quando a aba volta a ficar visível', async () => {
    renderHook(() => useWakeLock(true));
    await flush();
    // O navegador solta a trava quando a aba some de vista.
    await act(async () => {
      await sentinels[0]!.release();
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('ignora recusa do navegador sem quebrar', async () => {
    request.mockRejectedValueOnce(new DOMException('Low battery', 'NotAllowedError'));
    renderHook(() => useWakeLock(true));
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('sem suporte, não faz nada', async () => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
