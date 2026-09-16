import { useState } from 'react';
import Login from './pages/Login.jsx';
import Reservas from './pages/Reservas.jsx';

export default function App() {
  // Recupera o usuário salvo (se já estava logado).
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  function aoEntrar({ token, usuario }) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  }

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-titulo">
          Católica<span>Reserva</span>
        </div>
        {usuario && (
          <div className="topo-usuario">
            <span>{usuario.nome} · {usuario.tipo}</span>
            <button className="btn-link" onClick={sair}>Sair</button>
          </div>
        )}
      </header>

      <main className="conteudo">
        {usuario ? (
          <Reservas usuario={usuario} />
        ) : (
          <Login aoEntrar={aoEntrar} />
        )}
      </main>

      <footer className="rodape">
        CatólicaReserva — Sistema de Reserva de Salas de Estudo e Laboratórios
      </footer>
    </div>
  );
}
