import { useEffect } from 'react';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../toast';

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
          toast.success(`Conectado como ${a.user?.email ?? 'você'}. Sincronizando…`);
        else if (a.status === 'signedOut' && b.status === 'signedIn')
          toast.info(
            a.error ? a.error : 'Você saiu da conta. Seus ajustes continuam neste aparelho.',
          );
        else if (a.sync === 'error' && b.sync !== 'error' && a.error) toast.error(a.error);
        else if (a.sync === 'ok' && b.sync === 'error') toast.success('Sincronização retomada.');
      }),
    [],
  );
}
