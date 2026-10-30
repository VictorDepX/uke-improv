import { useEffect } from 'react';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../toast';
import { tNow } from '@/i18n/lang';

/**
 * Avisa mudanças de conta e de sincronização em qualquer aba (o painel da conta só existe
 * em Ajustes). Um aviso por mudança de estado, não um por tentativa.
 */
export function useAccountToasts(): void {
  useEffect(
    () =>
      useMusicStore.subscribe((s, prev) => {
        const a = s.account;
        const b = prev.account;
        if (a.status === 'signedIn' && b.status === 'signedOut')
          toast.success(
            tNow(
              `Conectado como ${a.user?.email ?? 'você'}. Sincronizando…`,
              `Signed in as ${a.user?.email ?? 'you'}. Syncing…`,
            ),
          );
        else if (a.status === 'signedOut' && b.status === 'signedIn')
          toast.info(
            a.error
              ? a.error
              : tNow(
                  'Você saiu da conta. Seus ajustes continuam neste aparelho.',
                  'You signed out. Your settings stay on this device.',
                ),
          );
        else if (a.sync === 'error' && b.sync !== 'error' && a.error) toast.error(a.error);
        else if (a.sync === 'ok' && b.sync === 'error')
          toast.success(tNow('Sincronização retomada.', 'Sync resumed.'));
      }),
    [],
  );
}
