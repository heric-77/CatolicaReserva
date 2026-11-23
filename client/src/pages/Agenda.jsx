// Agenda: linha do tempo do dia, com uma faixa por sala.
// As reservas aparecem como blocos contínuos; clicar em um horário livre
// abre o painel de reserva já preenchido.
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, DoorOpen, Plus } from 'lucide-react';
import { api } from '../api.js';
import { ocupacaoDaSala, posicaoNoDia, sobrepoe } from '../agenda.js';
import CabecalhoPagina from '../components/CabecalhoPagina.jsx';
import IconeSala from '../components/IconeSala.jsx';
import Mensagens from '../components/Mensagens.jsx';
import Vazio from '../components/Vazio.jsx';
import { useAcoes } from '../contexto/Acoes.js';
import { agoraHHMM, capitalizar, formatarDataPorExtenso, formatarHoraCheia, hojeISO, somarDias } from '../formatos.js';
import { useCarregar } from '../useCarregar.js';

// Lista as horas cheias entre a abertura e o fechamento: '07:00' e '10:00' -> [7, 8, 9]
function horasDoDia(abertura, fechamento) {
  const inicio = Number(abertura.slice(0, 2));
  const fim = Number(fechamento.slice(0, 2));
  return Array.from({ length: fim - inicio }, (_, i) => inicio + i);
}

function posicao(inicio, fim, agenda) {
  const { esquerda, largura } = posicaoNoDia(inicio, fim, agenda);
  return { left: `${esquerda}%`, width: `${largura}%` };
}

function Horario({ sala, data, hora, ocupacao, aoEscolher }) {
  const inicio = formatarHoraCheia(hora);
  const fim = formatarHoraCheia(hora + 1);

  if (ocupacao.some((faixa) => sobrepoe({ inicio, fim }, faixa))) {
    return <span className="slot" aria-hidden="true" />;
  }
  if (new Date(`${data}T${inicio}`) <= new Date()) {
    return <span className="slot slot-passado"><span className="so-leitor">Horário encerrado</span></span>;
  }
  return (
    <button
      type="button"
      className="slot slot-livre"
      aria-label={`Reservar ${sala.nome} das ${inicio} às ${fim}`}
      onClick={() => aoEscolher({ salaId: sala.id, data, horaInicio: inicio, horaFim: fim })}
    >
      <Plus size={14} aria-hidden="true" />
    </button>
  );
}

function LinhaDaSala({ sala, data, horas, agenda, agora, aoEscolher }) {
  const ocupacao = ocupacaoDaSala(sala.id, agenda.ocupadas);
  return (
    <tr>
      <th scope="row">
        <div className="sala-na-agenda">
          <IconeSala tipo={sala.tipo} />
          <span>
            <strong>{sala.nome}</strong>
            <small>Até {sala.capacidade} pessoas</small>
          </span>
        </div>
      </th>
      <td colSpan={horas.length} className="trilha-celula">
        <div className="trilha" style={{ gridTemplateColumns: `repeat(${horas.length}, minmax(0, 1fr))` }}>
          {horas.map((hora) => (
            <Horario key={hora} sala={sala} data={data} hora={hora} ocupacao={ocupacao} aoEscolher={aoEscolher} />
          ))}
          {ocupacao.map((faixa) => (
            <div key={faixa.inicio} className="bloco-ocupado" style={posicao(faixa.inicio, faixa.fim, agenda)}>
              <span className="so-leitor">Ocupada das {faixa.inicio} às {faixa.fim}</span>
              <span aria-hidden="true">{faixa.inicio}–{faixa.fim}</span>
            </div>
          ))}
          {agora && <span className="agora" style={{ left: posicao(agora, agora, agenda).left }} aria-hidden="true" />}
        </div>
      </td>
    </tr>
  );
}

export default function Agenda() {
  const { versao, abrirReserva } = useAcoes();
  const hoje = hojeISO();
  const [data, setData] = useState(hoje);
  const salas = useCarregar(() => api.listarSalas(), [versao]);
  const agenda = useCarregar(() => (data ? api.agendaDoDia(data) : Promise.resolve(null)), [data, versao]);

  const listaDeSalas = salas.dados ?? [];
  const agendaDaData = agenda.dados && agenda.dados.data === data ? agenda.dados : null;
  const erro = salas.erro || agenda.erro;
  const horas = agendaDaData ? horasDoDia(agendaDaData.abertura, agendaDaData.fechamento) : [];
  const hhmm = agoraHHMM();
  const linhaDoAgora = agendaDaData && data === hoje
    && hhmm >= agendaDaData.abertura && hhmm < agendaDaData.fechamento ? hhmm : null;

  // Em telas estreitas, rola a linha do tempo até o horário atual.
  const rolagem = useRef(null);
  const temLinhaDoAgora = Boolean(linhaDoAgora);
  useEffect(() => {
    const area = rolagem.current;
    const linha = area?.querySelector('.agora');
    if (!linha) return;
    const deslocamento = linha.getBoundingClientRect().left - area.getBoundingClientRect().left;
    area.scrollLeft += deslocamento - area.clientWidth / 2;
  }, [temLinhaDoAgora, data]);

  return (
    <>
      <CabecalhoPagina titulo="Agenda" descricao="Veja a ocupação de todas as salas e clique em um horário livre para reservar." />

      <section className="cartao cartao-agenda">
        <div className="agenda-controles">
          <div className="seletor-data">
            <button
              type="button"
              className="btn-secundario"
              aria-label="Dia anterior"
              disabled={!data || data <= hoje}
              onClick={() => setData(somarDias(data, -1))}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn-secundario" disabled={data === hoje} onClick={() => setData(hoje)}>
              Hoje
            </button>
            <button
              type="button"
              className="btn-secundario"
              aria-label="Próximo dia"
              disabled={!data}
              onClick={() => setData(somarDias(data, 1))}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <label className="campo-inline">
              <span className="so-leitor">Data</span>
              <input type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} />
            </label>
          </div>

          {agendaDaData && listaDeSalas.length > 0 && (
            <ul className="agenda-legenda" aria-label="Legenda">
              <li><span className="amostra amostra-livre" aria-hidden="true" /> Livre</li>
              <li><span className="amostra amostra-ocupada" aria-hidden="true" /> Ocupada</li>
              <li><span className="amostra amostra-passada" aria-hidden="true" /> Já passou</li>
            </ul>
          )}
        </div>

        <Mensagens erro={erro} />

        {!data && <Vazio>Escolha uma data para ver a agenda.</Vazio>}
        {data && !erro && salas.dados && listaDeSalas.length === 0 && (
          <Vazio icone={DoorOpen}>Nenhuma sala cadastrada.</Vazio>
        )}

        {agendaDaData && listaDeSalas.length > 0 && (
          <>
            <p className="agenda-titulo" aria-hidden="true">{capitalizar(formatarDataPorExtenso(data))}</p>
            <div ref={rolagem} className="agenda-rolagem" role="region" aria-label="Linha do tempo das salas">
              <table className="linha-do-tempo">
                <caption className="so-leitor">Horários de {formatarDataPorExtenso(data)}</caption>
                <thead>
                  <tr>
                    <th scope="col">Sala</th>
                    {horas.map((hora) => <th scope="col" key={hora}>{hora}h</th>)}
                  </tr>
                </thead>
                <tbody>
                  {listaDeSalas.map((sala) => (
                    <LinhaDaSala
                      key={sala.id}
                      sala={sala}
                      data={data}
                      horas={horas}
                      agenda={agendaDaData}
                      agora={linhaDoAgora}
                      aoEscolher={abrirReserva}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
