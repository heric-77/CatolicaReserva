// Administração: todas as reservas do sistema, com filtros.
import { useState } from 'react';
import { CalendarX, Search } from 'lucide-react';
import { api } from '../../api.js';
import ItemReserva from '../../components/ItemReserva.jsx';
import Mensagens from '../../components/Mensagens.jsx';
import Vazio from '../../components/Vazio.jsx';
import { useAcoes } from '../../contexto/Acoes.js';
import { useCarregar } from '../../useCarregar.js';

export default function AdminReservas() {
  const { versao, editarReserva, cancelarReserva } = useAcoes();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('ATIVA');
  const [data, setData] = useState('');
  const { dados, erro } = useCarregar(() => api.todasReservas(), [versao]);
  const reservas = dados ?? [];

  const termo = busca.trim().toLowerCase();
  const filtradas = reservas.filter((r) => (
    (status === 'TODAS' || r.status === status)
    && (!data || r.data === data)
    && (!termo || r.usuario_nome.toLowerCase().includes(termo) || r.sala_nome.toLowerCase().includes(termo))
  ));

  return (
    <section className="cartao">
      <div className="cartao-cabecalho">
        <h2>Todas as reservas</h2>
        <p>Reservas de todos os usuários. Filtre por situação, data ou nome.</p>
      </div>

      <div className="filtros formulario">
        <label>
          Buscar por usuário ou sala
          <span className="campo-com-icone">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Ex.: Ana ou Laboratório" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </span>
        </label>
        <label>
          Situação
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ATIVA">Ativas</option>
            <option value="CANCELADA">Canceladas</option>
            <option value="TODAS">Todas</option>
          </select>
        </label>
        <label>
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      </div>

      <Mensagens erro={erro} />

      <p className="contagem" role="status">
        {filtradas.length} {filtradas.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
      </p>

      {dados && filtradas.length === 0 && <Vazio icone={CalendarX}>Nenhuma reserva com esses filtros.</Vazio>}
      <ul className="lista-reservas">
        {filtradas.map((r) => (
          <ItemReserva
            key={r.id}
            reserva={r}
            mostrarUsuario
            aoEditar={editarReserva}
            aoCancelar={cancelarReserva}
          />
        ))}
      </ul>
    </section>
  );
}
