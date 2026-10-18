import { useEffect, useState } from 'react';
import { looper, type LooperView } from '@/audio/looper/looper';

/** Estado do looper para a tela (o motor vive fora do React). */
export function useLooper(): LooperView {
  const [view, setView] = useState<LooperView>(() => looper.view());
  useEffect(() => looper.subscribe(setView), []);
  return view;
}
