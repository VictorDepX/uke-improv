import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { feedbackAvailable, sendFeedback } from '@/monitoring';
import { toast } from '../toast';
import { useFeedback } from '../feedback';

/** Limite do texto do feedback (o Sentry aceita bem mais; isto evita colar um livro). */
const MAX_FEEDBACK = 2000;
/** Limite do e-mail opcional (o máximo de um endereço válido). */
const MAX_EMAIL = 254;

/**
 * Link discreto que abre o diálogo de feedback. Tem o peso de "Código aberto" e do idioma: está
 * sempre no mesmo canto, mas não compete com o braço. Some onde não há para onde mandar.
 */
export function FeedbackLink({ className, onOpen }: { className: string; onOpen?: () => void }) {
  const t = useT();
  const show = useFeedback((s) => s.show);
  if (!feedbackAvailable) return null;
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => {
        onOpen?.();
        show();
      }}
    >
      {t('Enviar feedback', 'Send feedback')}
    </button>
  );
}

/** Diálogo: o que a pessoa quer dizer e, se quiser resposta, o e-mail. */
export function FeedbackDialog() {
  const t = useT();
  const id = useId();
  const open = useFeedback((s) => s.open);
  const hide = useFeedback((s) => s.hide);
  const field = useRef<HTMLTextAreaElement>(null);
  const opener = useRef<Element | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Abriu: guarda quem abriu (o foco volta para ele) e põe o foco no texto.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    field.current?.focus();
  }, [open]);

  if (!open) return null;

  const close = () => {
    hide();
    if (opener.current instanceof HTMLElement && opener.current.isConnected) {
      opener.current.focus();
    }
  };
  const text = message.trim();
  const submit = async () => {
    if (!text || sending) return;
    setSending(true);
    const ok = await sendFeedback(text, email.trim() || undefined);
    setSending(false);
    if (ok) {
      setMessage('');
      setEmail('');
      close();
      toast.success(t('Feedback enviado. Obrigado.', 'Feedback sent. Thank you.'));
    } else {
      // O texto fica no campo para tentar de novo.
      toast.error(
        t(
          'Não deu para enviar. Confira a conexão e tente de novo.',
          "Couldn't send it. Check your connection and try again.",
        ),
      );
    }
  };

  return (
    <div className="feedback-layer">
      <div className="shell-scrim" aria-hidden="true" onClick={close} />
      <form
        className="feedback"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 id={`${id}-title`}>{t('Enviar feedback', 'Send feedback')}</h2>
        <div className="field">
          <label className="field-label" htmlFor={`${id}-msg`}>
            {t('Sua mensagem', 'Your message')}
          </label>
          <textarea
            ref={field}
            id={`${id}-msg`}
            className="input feedback-text"
            rows={5}
            required
            maxLength={MAX_FEEDBACK}
            value={message}
            placeholder={t(
              'O que funcionou, o que faltou ou o que deu errado.',
              'What worked, what was missing or what went wrong.',
            )}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${id}-email`}>
            {t('E-mail (opcional)', 'Email (optional)')}
          </label>
          <input
            id={`${id}-email`}
            className="input"
            type="email"
            autoComplete="email"
            maxLength={MAX_EMAIL}
            value={email}
            aria-describedby={`${id}-email-hint`}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p id={`${id}-email-hint`} className="field-hint">
            {t('Só se quiser resposta.', 'Only if you want a reply.')}
          </p>
        </div>
        <div className="feedback-actions">
          <button type="button" className="button button-ghost" onClick={close}>
            {t('Cancelar', 'Cancel')}
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={!text || sending}
            aria-busy={sending || undefined}
          >
            {sending ? t('Enviando', 'Sending') : t('Enviar', 'Send')}
          </button>
        </div>
      </form>
    </div>
  );
}
