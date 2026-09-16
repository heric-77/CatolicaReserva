import { useEffect, useState } from 'react';
import { api } from '../api.js';

const TIPO_LABEL = { SALA_ESTUDO: 'Sala de estudo', LABORATORIO: 'Laboratório' };

export default function Reservas() {
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  // Campos do formulário de nova reserva
  const [salaId, setSalaId] = useState('');
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');

  async function carregar() {
    setErro('');
    try {
      const [listaSalas, listaReservas] = await Promise.all([
        api.listarSalas(),
        api.minhasReservas(),
      ]);
      setSalas(listaSalas);
      setReservas(listaReservas);
      if (listaSalas.length && !salaId) setSalaId(String(listaSalas[0].id));
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function reservar(e) {
    e.preventDefault();
    setErro('');
    setAviso('');
    try {
      await api.criarReserva({ salaId: Number(salaId), data, horaInicio, horaFim });
      setAviso('Reserva realizada com sucesso!');
      setData(''); setHoraInicio(''); setHoraFim('');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function cancelar(id) {
    setErro('');
    setAviso('');
    try {
      await api.cancelarReserva(id);
      setAviso('Reserva cancelada.');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="grade">
      {/* Coluna: nova reserva */}
      <section className="cartao">
        <h2>Nova reserva</h2>
        <form onSubmit={reservar} className="formulario">
          <label>
            Sala
            <select value={salaId} onChange={(e) => setSalaId(e.target.value)} required>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({TIPO_LABEL[s.tipo]})
                </option>
              ))}
            </select>
          </label>

          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </label>

          <div className="linha">
            <label>
              Início
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
            </label>
            <label>
              Fim
              <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required />
            </label>
          </div>

          {erro && <p className="erro">{erro}</p>}
          {aviso && <p className="aviso">{aviso}</p>}

          <button className="btn">Reservar</button>
        </form>

        <h3 className="subtitulo">Salas disponíveis</h3>
        <ul className="lista-salas">
          {salas.map((s) => (
            <li key={s.id}>
              <strong>{s.nome}</strong>
              <span className="tag">{TIPO_LABEL[s.tipo]}</span>
              <small>{s.capacidade} lugares · {s.recursos || 'sem recursos'}</small>
            </li>
          ))}
        </ul>
      </section>

      {/* Coluna: minhas reservas */}
      <section className="cartao">
        <h2>Minhas reservas</h2>
        {reservas.length === 0 && <p className="vazio">Você ainda não tem reservas.</p>}
        <ul className="lista-reservas">
          {reservas.map((r) => (
            <li key={r.id} className={r.status === 'CANCELADA' ? 'cancelada' : ''}>
              <div>
                <strong>{r.sala_nome}</strong>
                <div className="detalhe">
                  {formatarData(r.data)} · {r.hora_inicio?.slice(0, 5)}–{r.hora_fim?.slice(0, 5)}
                </div>
              </div>
              <div className="acoes">
                <span className={`status ${r.status.toLowerCase()}`}>{r.status}</span>
                {r.status === 'ATIVA' && (
                  <button className="btn-secundario" onClick={() => cancelar(r.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
