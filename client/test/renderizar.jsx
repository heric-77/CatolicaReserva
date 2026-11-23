// Monta uma tela com os contextos que ela usa (ações da área logada e avisos).
// As ações são vi.fn() que o teste pode inspecionar; "confirmar" responde true por padrão.
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { AcoesContexto } from '../src/contexto/Acoes.js';
import { AvisosProvider } from '../src/contexto/Avisos.jsx';

export const aluno = { id: 7, nome: 'Ana Souza', tipo: 'ALUNO' };
export const admin = { id: 3, nome: 'Carla', tipo: 'ADMIN' };

export function criarAcoes(sobrescrever = {}) {
  return {
    usuario: aluno,
    versao: 0,
    abrirReserva: vi.fn(),
    editarReserva: vi.fn(),
    cancelarReserva: vi.fn(),
    confirmar: vi.fn().mockResolvedValue(true),
    navegar: vi.fn(),
    recarregar: vi.fn(),
    ...sobrescrever,
  };
}

export function renderizar(ui, sobrescrever = {}) {
  const acoes = criarAcoes(sobrescrever);
  const montar = (elemento, valor) => (
    <AvisosProvider>
      <AcoesContexto.Provider value={valor}>{elemento}</AcoesContexto.Provider>
    </AvisosProvider>
  );
  const resultado = render(montar(ui, acoes));
  return {
    ...resultado,
    acoes,
    // Simula o App mudando a "versão" depois de gravar algo.
    novaVersao: (versao) => resultado.rerender(montar(ui, { ...acoes, versao })),
  };
}
