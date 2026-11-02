import { useEffect, useState } from 'react';
import { EVENTO_SESSAO_EXPIRADA } from './api.js';
import Login from './pages/Login.jsx';
import Reservas from './pages/Reservas.jsx';
import Agenda from './pages/Agenda.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  // Recupera o usuário salvo (se já estava logado).
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [tela, setTela] = useState('reservas');
  const [horarioEscolhido, setHorarioEscolhido] = useState(null);
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
    setTela('reservas');
    setHorarioEscolhido(null);
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

  function navegar(destino) {
    setHorarioEscolhido(null);
    setTela(destino);
  }

  function aoEscolherHorario(horario) {
    setHorarioEscolhido(horario);
    setTela('reservas');
  }

  const telas = [
    { id: 'reservas', rotulo: 'Reservas' },
    { id: 'agenda', rotulo: 'Agenda' },
  ];
  if (usuario?.tipo === 'ADMIN') telas.push({ id: 'admin', rotulo: 'Administração' });

  return (
    <div className="app">
      <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>

      <header className="topo">
        <div className="topo-titulo">
          Católica<span>Reserva</span>
        </div>
        {usuario && (
          <nav className="navegacao" aria-label="Principal">
            {telas.map((t) => (
              <button
                key={t.id}
                aria-current={tela === t.id ? 'page' : undefined}
                onClick={() => navegar(t.id)}
              >
                {t.rotulo}
              </button>
            ))}
          </nav>
        )}
        {usuario && (
          <div className="topo-usuario">
            <span>{usuario.nome} · {usuario.tipo}</span>
            <button className="btn-link" onClick={sair}>Sair</button>
          </div>
        )}
      </header>

      <main className="conteudo" id="conteudo" tabIndex={-1}>
        {!usuario && <Login aoEntrar={aoEntrar} mensagem={mensagemLogin} />}
        {usuario && tela === 'reservas' && <Reservas horarioEscolhido={horarioEscolhido} />}
        {usuario && tela === 'agenda' && <Agenda aoEscolherHorario={aoEscolherHorario} />}
        {usuario && tela === 'admin' && <Admin usuario={usuario} />}
      </main>

      <footer className="rodape">
        CatólicaReserva — Sistema de Reserva de Salas de Estudo e Laboratórios
      </footer>
    </div>
  );
}
