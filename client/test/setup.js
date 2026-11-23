// Preparação comum a todos os testes do cliente.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Com a medição de cobertura ligada os testes ficam mais lentos:
// dá mais tempo para findBy/waitFor antes de considerar que falhou.
configure({ asyncUtilTimeout: 4000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
});
