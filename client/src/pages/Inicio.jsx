// Início: resumo do usuário, próxima reserva e salas livres agora.
import { ArrowRight, CalendarCheck, CalendarX, Clock, DoorOpen, Plus } from 'lucide-react';
import { api } from '../api.js';
import { horasNoMes, proximoHorario, separarReservas, situacaoDaSala } from '../agenda.js';
import CabecalhoPagina from '../components/CabecalhoPagina.jsx';
import IconeSala from '../components/IconeSala.jsx';
import ItemReserva from '../components/ItemReserva.jsx';
import Mensagens from '../components/Mensagens.jsx';
import Vazio from '../components/Vazio.jsx';
import { useAcoes } from '../contexto/Acoes.js';
import {
  agoraHHMM,
  capitalizar,
  formatarDataPorExtenso,
  formatarDuracao,
  formatarHora,
  hojeISO,
  nomeDoMes,
  primeiroNome,
  rotuloDoDia,
  saudacao,
} from '../formatos.js';
import { useCarregar } from '../useCarregar.js';

function Estatistica({ icone: Icone, rotulo, valor }) {
  return (
    <div className="estatistica">
      <span className="estatistica-icone" aria-hidden="true"><Icone size={18} /></span>
      <div>
        <p className="estatistica-valor">{valor}</p>
        <p className="estatistica-rotulo">{rotulo}</p>
      </div>
    </div>
  );
}

function DestaqueReserva({ reserva, aoEditar, aoCancelar }) {
  const inicio = formatarHora(reserva.hora_inicio);
  const fim = formatarHora(reserva.hora_fim);
  return (
    <div className="destaque-reserva">
      <p className="destaque-dia">{rotuloDoDia(reserva.data)}</p>
      <p className="destaque-horario">{inicio} – {fim}</p>
      <p className="destaque-sala">{reserva.sala_nome} · {formatarDuracao(inicio, fim)}</p>
      <div className="acoes">
        <button type="button" className="btn-secundario" onClick={() => aoEditar(reserva)}>Editar</button>
        <button type="button" className="btn-secundario perigo" onClick={() => aoCancelar(reserva)}>Cancelar</button>
      </div>
    </div>
  );
}

export default function Inicio() {
  const { usuario, versao, abrirReserva, editarReserva, cancelarReserva, navegar } = useAcoes();
  const hoje = hojeISO();
  const { dados, erro } = useCarregar(
    () => Promise.all([api.minhasReservas(), api.listarSalas(), api.agendaDoDia(hoje)]),
    [versao, hoje]
  );
  const [reservas, salas, agenda] = dados ?? [[], [], null];

  const agora = new Date();
  const hhmm = agoraHHMM(agora);
  const { proximas } = separarReservas(reservas, agora);
  const [proxima, ...depois] = proximas;
  const horas = horasNoMes(reservas, hoje.slice(0, 7));
  const sugestao = agenda ? proximoHorario(hhmm, agenda) : null;
  const livresAgora = agenda
    ? salas
      .map((sala) => ({ sala, situacao: situacaoDaSala(sala.id, agenda.ocupadas, agenda, hhmm) }))
      .filter(({ situacao }) => situacao.tipo === 'livre')
    : [];

  const botaoReservar = (
    <button type="button" className="btn" onClick={() => abrirReserva()}>
      <Plus size={16} aria-hidden="true" />
      Reservar uma sala
    </button>
  );

  return (
    <>
      <CabecalhoPagina titulo={`${saudacao(agora)}, ${primeiroNome(usuario.nome)}`} descricao={capitalizar(formatarDataPorExtenso(hoje))}>
        {botaoReservar}
      </CabecalhoPagina>

      <Mensagens erro={erro} />

      <div className="estatisticas">
        <Estatistica icone={CalendarCheck} rotulo="Próximas reservas" valor={proximas.length} />
        <Estatistica
          icone={Clock}
          rotulo={`Horas reservadas em ${nomeDoMes(hoje)}`}
          valor={`${String(horas).replace('.', ',')} h`}
        />
        <Estatistica
          icone={DoorOpen}
          rotulo="Salas livres agora"
          valor={agenda ? `${livresAgora.length} de ${salas.length}` : '–'}
        />
      </div>

      <div className="grade-inicio">
        <section className="cartao">
          <div className="cartao-cabecalho com-acao">
            <h2>Próxima reserva</h2>
            <button type="button" className="btn-link" onClick={() => navegar('reservas')}>
              Ver todas <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          {proxima ? (
            <DestaqueReserva reserva={proxima} aoEditar={editarReserva} aoCancelar={cancelarReserva} />
          ) : (
            <Vazio icone={CalendarX} acao={botaoReservar}>Você não tem reservas futuras.</Vazio>
          )}
          {depois.length > 0 && (
            <>
              <h3 className="subtitulo">Depois</h3>
              <ul className="lista-reservas">
                {depois.slice(0, 3).map((r) => (
                  <ItemReserva key={r.id} reserva={r} aoEditar={editarReserva} aoCancelar={cancelarReserva} />
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="cartao">
          <div className="cartao-cabecalho">
            <h2>Livres agora</h2>
            <p>
              {sugestao
                ? `Próximo horário para reservar: ${sugestao.horaInicio} às ${sugestao.horaFim}.`
                : 'Fora do horário de funcionamento.'}
            </p>
          </div>
          {agenda && livresAgora.length === 0 && <Vazio icone={DoorOpen}>Nenhuma sala livre agora.</Vazio>}
          <ul className="lista-salas">
            {livresAgora.map(({ sala, situacao }) => (
              <li key={sala.id}>
                <IconeSala tipo={sala.tipo} />
                <div>
                  <strong>{sala.nome}</strong>
                  <small>Livre até {situacao.ate} · até {sala.capacidade} pessoas</small>
                </div>
                <button
                  type="button"
                  className="btn-secundario"
                  aria-label={`Reservar ${sala.nome}`}
                  onClick={() => abrirReserva({ salaId: sala.id, data: hoje, ...sugestao })}
                >
                  Reservar
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
