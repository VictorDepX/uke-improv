import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

function Broken(): never {
  throw new Error('quebrou');
}

describe('tela de erro', () => {
  it('troca a parte quebrada por um aviso com botão de recarregar', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado nesta tela');
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument();
    spy.mockRestore();
  });
});
