// Uma reserva na lista: horário (ou bloco com a data), sala, situação e ações.
// Usado em "Minhas reservas", no Início e na lista de todas as reservas da administração.
import { Clock, Pencil, UserRound, X } from 'lucide-react';
import { formatarData, formatarDuracao, formatarHora, partesDaData } from '../formatos.js';

// Situação mostrada na lista: uma reserva ativa que já terminou aparece como concluída.
function situacao(reserva) {
  if (reserva.status === 'CANCELADA') return { classe: 'cancelada', rotulo: 'Cancelada' };
  const fim = new Date(`${reserva.data.slice(0, 10)}T${reserva.hora_fim}`);
  if (fim <= new Date()) return { classe: 'concluida', rotulo: 'Concluída' };
  return { classe: 'ativa', rotulo: 'Ativa' };
}

export default function ItemReserva({ reserva: r, mostrarData = true, mostrarUsuario = false, aoEditar, aoCancelar }) {
  const { classe, rotulo } = situacao(r);
  const ativa = classe === 'ativa';
  const inicio = formatarHora(r.hora_inicio);
  const fim = formatarHora(r.hora_fim);
  const { dia, mes } = partesDaData(r.data);

  return (
    <li className={`item-reserva${ativa ? '' : ` ${classe}`}`}>
      {mostrarData ? (
        <div className="data-bloco" aria-hidden="true">
          <span className="data-bloco-mes">{mes}</span>
          <span className="data-bloco-dia">{dia}</span>
        </div>
      ) : (
        <div className="hora-bloco" aria-hidden="true">
          <span>{inicio}</span>
          <span>{fim}</span>
        </div>
      )}

      <div className="item-reserva-info">
        <strong>{r.sala_nome}</strong>
        {mostrarUsuario && (
          <div className="detalhe">
            <UserRound size={14} aria-hidden="true" />
            {r.usuario_nome}
          </div>
        )}
        <div className="detalhe">
          <Clock size={14} aria-hidden="true" />
          {mostrarData
            ? `${formatarData(r.data)} · ${inicio}–${fim} · ${formatarDuracao(inicio, fim)}`
            : `${formatarDuracao(inicio, fim)} de duração`}
        </div>
      </div>

      <div className="acoes">
        <span className={`status ${classe}`}>{rotulo}</span>
        {ativa && aoEditar && (
          <button type="button" className="btn-secundario" onClick={() => aoEditar(r)}>
            <Pencil size={14} aria-hidden="true" />
            Editar
          </button>
        )}
        {ativa && aoCancelar && (
          <button type="button" className="btn-secundario perigo" onClick={() => aoCancelar(r)}>
            <X size={14} aria-hidden="true" />
            Cancelar
          </button>
        )}
      </div>
    </li>
  );
}
