// Ações da área logada que qualquer tela pode disparar: abrir o painel de
// reserva, editar, cancelar, pedir confirmação e navegar. Quem fornece é o App.
// "versao" muda sempre que algo é gravado: as telas recarregam os dados quando ela muda.
import { createContext, useContext } from 'react';

const naoConfigurado = () => {
  throw new Error('useAcoes precisa estar dentro do App (AcoesContexto.Provider).');
};

export const AcoesContexto = createContext({
  usuario: null,
  versao: 0,
  abrirReserva: naoConfigurado,
  editarReserva: naoConfigurado,
  cancelarReserva: naoConfigurado,
  confirmar: naoConfigurado,
  navegar: naoConfigurado,
  recarregar: naoConfigurado,
});

export function useAcoes() {
  return useContext(AcoesContexto);
}
