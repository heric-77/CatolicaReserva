import { useEffect, useState } from 'react';
import { EVENTO_SESSAO_EXPIRADA } from './api.js';
import AreaLogada from './AreaLogada.jsx';
import { AvisosProvider } from './contexto/Avisos.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  // Recupera o usuário salvo (se já estava logado).
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [mensagemLogin, setMensagemLogin] = useState('');

  function aoEntrar({ token, usuario }) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setMensagemLogin('');
    setUsuario(usuario);
  }

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  // Volta para o login quando o servidor recusa o token.
  useEffect(() => {
    function aoExpirar() {
      sair();
      setMensagemLogin('Sua sessão expirou. Entre novamente.');
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  if (!usuario) {
    return (
      <main className="app-publico" id="conteudo" tabIndex={-1}>
        <Login aoEntrar={aoEntrar} mensagem={mensagemLogin} />
      </main>
    );
  }

  return (
    <AvisosProvider>
      <AreaLogada usuario={usuario} aoSair={sair} />
    </AvisosProvider>
  );
}
