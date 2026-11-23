// Formulário de reserva (criar e editar), usado dentro do painel lateral.
// Mostra a ocupação da sala no dia escolhido e avisa antes de enviar se o
// horário conflita com outra reserva. Quem decide de verdade é o servidor.
import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { api } from '../api.js';
import { ocupacaoDaSala, posicaoNoDia, sobrepoe } from '../agenda.js';
import { TIPO_SALA, formatarDuracao, hojeISO, paraHora, somarMinutos } from '../formatos.js';
import { validarReserva } from '../validacoes.js';
import Mensagens from './Mensagens.jsx';

const DURACOES = [30, 60, 90, 120];

// Barra do expediente com os horários ocupados e o horário escolhido.
function FaixaDoDia({ ocupacao, escolhido }) {
  const { abertura, fechamento, faixas } = ocupacao;
  const estilo = (faixa) => {
    const { esquerda, largura } = posicaoNoDia(faixa.inicio, faixa.fim, ocupacao);
    return { left: `${esquerda}%`, width: `${largura}%` };
  };
  return (
    <div className="faixa-do-dia" aria-hidden="true">
      <div className="faixa-do-dia-trilha">
        {faixas.map((f) => <span key={f.inicio} className="faixa-ocupada" style={estilo(f)} />)}
        {escolhido && <span className="faixa-escolhida" style={estilo(escolhido)} />}
      </div>
      <div className="faixa-do-dia-horas">
        <span>{abertura}</span>
        <span>{fechamento}</span>
      </div>
    </div>
  );
}

export default function FormularioReserva({ salas, inicial = {}, rotulo, aoEnviar, aoDesistir, ignorar }) {
  const [salaId, setSalaId] = useState(inicial.salaId ? String(inicial.salaId) : '');
  const [data, setData] = useState(inicial.data || '');
  const [horaInicio, setHoraInicio] = useState(inicial.horaInicio || '');
  const [horaFim, setHoraFim] = useState(inicial.horaFim || '');
  const [ocupacao, setOcupacao] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // As salas podem chegar depois do formulário aparecer.
  useEffect(() => {
    if (!salaId && salas.length) setSalaId(String(salas[0].id));
  }, [salas, salaId]);

  // Busca os horários ocupados da sala na data escolhida.
  useEffect(() => {
    if (!salaId || !data) {
      setOcupacao(null);
      return undefined;
    }
    let atual = true;
    api.agendaDoDia(data)
      .then(({ abertura, fechamento, ocupadas }) => {
        if (!atual) return;
        const faixas = ocupacaoDaSala(Number(salaId), ocupadas).filter(
          // Ao editar, a própria reserva não conta como ocupação.
          (f) => !(ignorar && ignorar.salaId === Number(salaId) && ignorar.data === data
            && ignorar.inicio === f.inicio && ignorar.fim === f.fim)
        );
        setOcupacao({ abertura, fechamento, faixas });
      })
      .catch(() => { if (atual) setOcupacao(null); });
    return () => { atual = false; };
  }, [salaId, data, ignorar]);

  const escolhido = horaInicio && horaFim && horaFim > horaInicio ? { inicio: horaInicio, fim: horaFim } : null;
  const conflito = Boolean(escolhido && ocupacao?.faixas.some((f) => sobrepoe(escolhido, f)));

  async function enviar(e) {
    e.preventDefault();
    const dados = { salaId: Number(salaId), data, horaInicio, horaFim };
    const problema = validarReserva(dados);
    setErro(problema || '');
    if (problema) return;

    setEnviando(true);
    try {
      await aoEnviar(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="formulario" noValidate>
      <label>
        Sala
        <select value={salaId} onChange={(e) => setSalaId(e.target.value)}>
          {salas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} ({TIPO_SALA[s.tipo]})
            </option>
          ))}
        </select>
      </label>

      <label>
        Data
        <input type="date" min={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
      </label>

      <div className="linha">
        <label>
          Início
          <input type="time" step="900" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        </label>
        <label>
          Fim
          <input type="time" step="900" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
        </label>
      </div>

      <fieldset className="duracoes">
        <legend>Duração</legend>
        {DURACOES.map((duracao) => {
          const fim = horaInicio ? somarMinutos(horaInicio, duracao) : '';
          return (
            <button
              key={duracao}
              type="button"
              className="chip"
              aria-pressed={Boolean(horaInicio) && horaFim === fim}
              disabled={!horaInicio}
              onClick={() => setHoraFim(fim)}
            >
              {formatarDuracao('00:00', paraHora(duracao))}
            </button>
          );
        })}
      </fieldset>

      {ocupacao && (
        <div className={`disponibilidade${conflito ? ' com-conflito' : ''}`}>
          <p className="disponibilidade-titulo">Ocupação da sala neste dia</p>
          <FaixaDoDia ocupacao={ocupacao} escolhido={escolhido} />
          <p className="disponibilidade-texto">
            {ocupacao.faixas.length === 0
              ? 'Livre o dia todo.'
              : `Ocupada: ${ocupacao.faixas.map((f) => `${f.inicio}–${f.fim}`).join(', ')}.`}
          </p>
          {conflito && (
            <p className="disponibilidade-conflito">
              <TriangleAlert size={16} aria-hidden="true" />
              Esse horário conflita com outra reserva desta sala.
            </p>
          )}
        </div>
      )}

      <Mensagens erro={erro} />

      <div className="botoes-formulario">
        {aoDesistir && (
          <button type="button" className="btn-secundario" onClick={aoDesistir}>
            Voltar
          </button>
        )}
        <button type="submit" className="btn" disabled={enviando || salas.length === 0}>
          {enviando ? 'Aguarde...' : rotulo}
        </button>
      </div>
    </form>
  );
}
