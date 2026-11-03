import { useT } from '@/i18n';
import { useMicControl } from '../hooks/useMicControl';
import { Icon } from './Icon';

/** Botão de ícone do microfone (barra do celular). "Ao vivo" (borda vermelha) = ouvindo. */
export function MicToggle() {
  const t = useT();
  const { status, start, stop } = useMicControl();
  const on = status === 'on';
  return (
    <button
      type="button"
      className="icon-button mic-toggle"
      data-live={on || undefined}
      aria-pressed={on}
      aria-label={t('Microfone', 'Microphone')}
      disabled={status === 'starting'}
      onClick={() => (on ? stop() : void start())}
    >
      <Icon name="mic" />
    </button>
  );
}
