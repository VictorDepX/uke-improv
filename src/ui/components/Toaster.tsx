import { useToasts } from '../toast';

/** Região de avisos: lida pelos leitores de tela (polite para sucesso, assertive para erro). */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast"
          data-kind={t.kind}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span className="toast-icon" aria-hidden="true" />
          <span className="toast-message">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                t.action!.run();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="toast-close"
            aria-label="Fechar aviso"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
