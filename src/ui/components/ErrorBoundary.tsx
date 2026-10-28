import { Component, type ReactNode } from 'react';
import { reportError } from '@/monitoring';

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
        <h1>Algo deu errado nesta tela</h1>
        <p>
          O erro foi registrado. Recarregue para continuar; seus ajustes e progressões ficam
          guardados.
        </p>
        <button type="button" className="button button-primary" onClick={() => location.reload()}>
          Recarregar
        </button>
      </div>
    );
  }
}
