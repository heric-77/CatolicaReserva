// Notificações rápidas ("toasts") no canto da tela.
// Sucessos são anunciados pelos leitores de tela como status; erros, como alerta.
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const DURACAO_MS = 5000;
const AvisosContexto = createContext(() => {});

export function useAvisos() {
  return useContext(AvisosContexto);
}

function Aviso({ aviso, aoFechar }) {
  const Icone = aviso.tipo === 'erro' ? CircleAlert : CircleCheck;
  return (
    <div className={`toast toast-${aviso.tipo}`}>
      <Icone size={18} aria-hidden="true" />
      <p>{aviso.texto}</p>
      <button type="button" className="btn-icone" aria-label="Fechar aviso" onClick={() => aoFechar(aviso.id)}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const proximoId = useRef(0);

  const remover = useCallback((id) => {
    setAvisos((atuais) => atuais.filter((a) => a.id !== id));
  }, []);

  const avisar = useCallback((texto, tipo = 'sucesso') => {
    proximoId.current += 1;
    const id = proximoId.current;
    setAvisos((atuais) => [...atuais, { id, texto, tipo }]);
    setTimeout(() => remover(id), DURACAO_MS);
  }, [remover]);

  return (
    <AvisosContexto.Provider value={avisar}>
      {children}
      <div className="toasts">
        <div role="status">
          {avisos.filter((a) => a.tipo !== 'erro').map((a) => <Aviso key={a.id} aviso={a} aoFechar={remover} />)}
        </div>
        <div role="alert">
          {avisos.filter((a) => a.tipo === 'erro').map((a) => <Aviso key={a.id} aviso={a} aoFechar={remover} />)}
        </div>
      </div>
    </AvisosContexto.Provider>
  );
}
