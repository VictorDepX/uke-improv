import { Component, type ReactNode } from 'react';
import { reportError } from '@/monitoring';
import { tNow } from '@/i18n/lang';

interface State {
  failed: boolean;
}

/** Se uma parte da tela quebrar, mostra um aviso com saída em vez de uma página em branco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    reportError(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="crash" role="alert">
        <h1>{tNow('Algo deu errado nesta tela', 'Something went wrong on this screen')}</h1>
        <p>
          {tNow(
            'O erro foi registrado. Recarregue para continuar; seus ajustes e progressões ficam guardados.',
            'The error was logged. Reload to continue; your settings and progressions are kept.',
          )}
        </p>
        <button type="button" className="button button-primary" onClick={() => location.reload()}>
          {tNow('Recarregar', 'Reload')}
        </button>
      </div>
    );
  }
}
