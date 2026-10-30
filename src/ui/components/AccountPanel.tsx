import { useId, useState, type FormEvent } from 'react';
import { useMusicStore } from '@/store/useMusicStore';
import { ACCOUNT_LIMITS, signIn, signOut, signUp, syncNow } from '@/sync/sync';
import { LOCALE, useLang, useT, type Lang } from '@/i18n';
import { Panel, Segmented } from './controls';

const time = (ms: number, lang: Lang) =>
  new Date(ms).toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit' });

/** Conta (e-mail e senha) e sincronização de ajustes, progressões e progresso. */
export function AccountPanel() {
  const t = useT();
  const lang = useLang();
  const account = useMusicStore((s) => s.account);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const ids = { name: useId(), email: useId(), password: useId() };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok =
      mode === 'up'
        ? await signUp(
            (name.trim() || email.split('@')[0]!).slice(0, ACCOUNT_LIMITS.name),
            email.trim(),
            password,
          )
        : await signIn(email.trim(), password);
    setBusy(false);
    if (ok) setPassword('');
  };

  if (account.status === 'unknown')
    return (
      <Panel title={t('Conta', 'Account')}>
        <p className="small muted">{t('Verificando a sessão…', 'Checking your session…')}</p>
      </Panel>
    );

  if (account.status === 'signedIn' && account.user)
    return (
      <Panel title="Conta">
        <div className="stack">
          <p className="account-who">
            <strong>{account.user.name || account.user.email}</strong>
            <span className="small muted">{account.user.email}</span>
          </p>
          <p className="small account-sync" data-state={account.sync} role="status">
            {account.sync === 'syncing'
              ? t('Sincronizando…', 'Syncing…')
              : account.sync === 'error'
                ? account.error
                : account.lastSync
                  ? t(
                      `Sincronizado às ${time(account.lastSync, lang)}.`,
                      `Synced at ${time(account.lastSync, lang)}.`,
                    )
                  : t('Pronto para sincronizar.', 'Ready to sync.')}
          </p>
          <p className="small muted">
            {t(
              'Ajustes (com calibração), progressões próprias e cifras, e o placar do treino de ouvido e dos exercícios vão para a nuvem e chegam aos seus outros aparelhos.',
              'Settings (including calibration), your own progressions and charts, and your ear training and exercise scores go to the cloud and reach your other devices.',
            )}
          </p>
          <div className="editor-actions">
            <button type="button" className="button" onClick={() => void syncNow()}>
              {t('Sincronizar agora', 'Sync now')}
            </button>
            <button type="button" className="button" onClick={() => void signOut()}>
              {t('Sair', 'Sign out')}
            </button>
          </div>
        </div>
      </Panel>
    );

  return (
    <Panel title={t('Conta', 'Account')}>
      <form className="stack account-form" onSubmit={(e) => void submit(e)}>
        <Segmented
          label={t('Acesso', 'Access')}
          hideLabel
          value={mode}
          options={[
            { value: 'in', label: t('Entrar', 'Sign in') },
            { value: 'up', label: t('Criar conta', 'Create account') },
          ]}
          onChange={setMode}
        />
        {mode === 'up' ? (
          <label className="field" htmlFor={ids.name}>
            <span className="field-label">{t('Nome', 'Name')}</span>
            <input
              id={ids.name}
              className="input"
              autoComplete="name"
              maxLength={ACCOUNT_LIMITS.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        ) : null}
        <label className="field" htmlFor={ids.email}>
          <span className="field-label">{t('E-mail', 'Email')}</span>
          <input
            id={ids.email}
            className="input"
            type="email"
            required
            autoComplete="email"
            maxLength={ACCOUNT_LIMITS.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field" htmlFor={ids.password}>
          <span className="field-label">{t('Senha', 'Password')}</span>
          <input
            id={ids.password}
            className="input"
            type="password"
            required
            minLength={ACCOUNT_LIMITS.passwordMin}
            maxLength={ACCOUNT_LIMITS.passwordMax}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {account.error ? (
          <p className="notice" role="alert">
            {account.error}
          </p>
        ) : null}
        <div className="editor-actions">
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy
              ? t('Aguarde…', 'Please wait…')
              : mode === 'up'
                ? t('Criar conta', 'Create account')
                : t('Entrar', 'Sign in')}
          </button>
        </div>
        <p className="small muted">
          {t(
            'Opcional. Com conta, seus ajustes, progressões e progresso ficam iguais em todos os aparelhos. Sem conta, tudo continua salvo só neste aparelho.',
            'Optional. With an account, your settings, progressions and progress are the same on all your devices. Without one, everything stays saved on this device only.',
          )}
        </p>
      </form>
    </Panel>
  );
}
