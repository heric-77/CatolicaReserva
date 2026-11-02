// Painel do administrador com todas as reservas do sistema.
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import FormularioReserva from '../../components/FormularioReserva.jsx';
import Mensagens from '../../components/Mensagens.jsx';
import { formatarData, formatarHora } from '../../formatos.js';

export default function AdminReservas() {
  const [reservas, setReservas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('ATIVA');
  const [data, setData] = useState('');

  async function carregar() {
    try {
      const [listaReservas, listaSalas] = await Promise.all([api.todasReservas(), api.listarSalas()]);
      setReservas(listaReservas);
      setSalas(listaSalas);
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function salvarEdicao(id, dados) {
    setErro('');
    setAviso('');
    await api.editarReserva(id, dados);
    setAviso('Reserva alterada com sucesso!');
    setEditandoId(null);
    carregar();
  }

  async function cancelar(reserva) {
    if (!window.confirm(`Cancelar a reserva de ${reserva.usuario_nome} em ${reserva.sala_nome}?`)) return;
    setErro('');
    setAviso('');
    try {
      await api.cancelarReserva(reserva.id);
      setAviso('Reserva cancelada.');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  const termo = busca.trim().toLowerCase();
  const filtradas = reservas.filter((r) => (
    (status === 'TODAS' || r.status === status)
    && (!data || r.data === data)
    && (!termo || r.usuario_nome.toLowerCase().includes(termo) || r.sala_nome.toLowerCase().includes(termo))
  ));

  return (
    <section className="cartao">
      <h2>Todas as reservas</h2>

      <div className="filtros formulario">
        <label>
          Buscar por usuário ou sala
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />
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

      <Mensagens erro={erro} aviso={aviso} />

      <p className="contagem" role="status">
        {filtradas.length} {filtradas.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
      </p>

      <ul className="lista-reservas">
        {filtradas.map((r) => (
          <li key={r.id} className={r.status === 'CANCELADA' ? 'cancelada' : ''}>
            <div>
              <strong>{r.sala_nome}</strong>
              <div className="detalhe">{r.usuario_nome}</div>
              <div className="detalhe">
                {formatarData(r.data)} · {formatarHora(r.hora_inicio)}–{formatarHora(r.hora_fim)}
              </div>
            </div>
            <div className="acoes">
              <span className={`status ${r.status.toLowerCase()}`}>{r.status}</span>
              {r.status === 'ATIVA' && editandoId !== r.id && (
                <>
                  <button className="btn-secundario" onClick={() => setEditandoId(r.id)}>Editar</button>
                  <button className="btn-secundario" onClick={() => cancelar(r)}>Cancelar</button>
                </>
              )}
            </div>
            {editandoId === r.id && (
              <div className="edicao">
                <FormularioReserva
                  salas={salas}
                  inicial={{
                    salaId: r.sala_id,
                    data: r.data,
                    horaInicio: formatarHora(r.hora_inicio),
                    horaFim: formatarHora(r.hora_fim),
                  }}
                  rotulo="Salvar alterações"
                  aoEnviar={(dados) => salvarEdicao(r.id, dados)}
                  aoDesistir={() => setEditandoId(null)}
                  focar
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
