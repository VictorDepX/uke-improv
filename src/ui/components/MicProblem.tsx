import { useT } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';

/**
 * Microfone que não abriu: o que houve, o que fazer e um botão para tentar de novo.
 * Usado na escuta (Explorar) e no afinador.
 */
export function MicProblem({ onRetry, alert = false }: { onRetry: () => void; alert?: boolean }) {
  const t = useT();
  const status = useMusicStore((s) => s.mic.status);
  const error = useMusicStore((s) => s.mic.error);
  if (status !== 'denied' && status !== 'error') return null;

  const unsupported =
    typeof navigator === 'undefined' || typeof navigator.mediaDevices?.getUserMedia !== 'function';
  const how = unsupported
    ? t(
        'Abra o Uke Improv no Chrome, Safari, Edge ou Firefox atualizados.',
        'Open Uke Improv in an up-to-date Chrome, Safari, Edge or Firefox.',
      )
    : status === 'denied'
      ? t(
          'Toque no cadeado ao lado do endereço do site, permita o microfone e tente de novo.',
          'Tap the lock next to the site address, allow the microphone and try again.',
        )
      : t(
          'Feche outros apps que estejam usando o microfone e tente de novo.',
          'Close other apps that are using the microphone and try again.',
        );

  return (
    <div className="notice mic-problem" role={alert ? 'alert' : 'status'}>
      <p>
        <strong>{error}</strong> {how}
      </p>
      {unsupported ? null : (
        <button type="button" className="button button-ghost" onClick={onRetry}>
          {t('Tentar de novo', 'Try again')}
        </button>
      )}
    </div>
  );
}
