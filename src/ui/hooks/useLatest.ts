import { useLayoutEffect, useRef } from 'react';

/** Ref sempre com o valor mais recente, para callbacks de longa duração (áudio, rAF). */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
