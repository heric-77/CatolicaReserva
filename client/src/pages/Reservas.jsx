import { useEffect, useState } from 'react';
import { api } from '../api.js';
import FormularioReserva from '../components/FormularioReserva.jsx';
import Mensagens from '../components/Mensagens.jsx';
import { TIPO_SALA, formatarData, formatarHora } from '../formatos.js';

export default function Reservas({ horarioEscolhido }) {
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  // Mudar a chave recria o formulário de nova reserva, limpando os campos.
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const [inicial, setInicial] = useState(horarioEscolhido || {});

  async function carregar() {
    try {
      const [listaSalas, listaReservas] = await Promise.all([
        api.listarSalas(),
        api.minhasReservas(),
      ]);
      setSalas(listaSalas);
      setReservas(listaReservas);
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function reservar(dados) {
    setErro('');
    setAviso('');
    await api.criarReserva(dados);
    setAviso('Reserva realizada com sucesso!');
    setInicial({});
    setChaveFormulario((chave) => chave + 1);
    carregar();
  }

  async function salvarEdicao(id, dados) {
    setErro('');
    setAviso('');
    await api.editarReserva(id, dados);
    setAviso('Reserva alterada com sucesso!');
    setEditandoId(null);
    carregar();
  }

  async function cancelar(id) {
    if (!window.confirm('Deseja cancelar esta reserva?')) return;
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
        <FormularioReserva
          key={chaveFormulario}
          salas={salas}
          inicial={inicial}
          rotulo="Reservar"
          aoEnviar={reservar}
        />

        <h3 className="subtitulo">Salas disponíveis</h3>
        {salas.length === 0 && <p className="vazio">Nenhuma sala cadastrada.</p>}
        <ul className="lista-salas">
          {salas.map((s) => (
            <li key={s.id}>
              <strong>{s.nome}</strong>
              <span className="tag">{TIPO_SALA[s.tipo]}</span>
              <small>{s.capacidade} lugares · {s.recursos || 'sem recursos'}</small>
            </li>
          ))}
        </ul>
      </section>

      {/* Coluna: minhas reservas */}
      <section className="cartao">
        <h2>Minhas reservas</h2>
        <Mensagens erro={erro} aviso={aviso} />
        {reservas.length === 0 && <p className="vazio">Você ainda não tem reservas.</p>}
        <ul className="lista-reservas">
          {reservas.map((r) => (
            <li key={r.id} className={r.status === 'CANCELADA' ? 'cancelada' : ''}>
              <div>
                <strong>{r.sala_nome}</strong>
                <div className="detalhe">
                  {formatarData(r.data)} · {formatarHora(r.hora_inicio)}–{formatarHora(r.hora_fim)}
                </div>
              </div>
              <div className="acoes">
                <span className={`status ${r.status.toLowerCase()}`}>{r.status}</span>
                {r.status === 'ATIVA' && editandoId !== r.id && (
                  <>
                    <button className="btn-secundario" onClick={() => setEditandoId(r.id)}>
                      Editar
                    </button>
                    <button className="btn-secundario" onClick={() => cancelar(r.id)}>
                      Cancelar
                    </button>
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
    </div>
  );
}
