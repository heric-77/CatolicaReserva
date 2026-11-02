// Agenda: mostra, para uma data, os horários livres e ocupados de cada sala.
// Clicar em um horário livre leva para o formulário de reserva já preenchido.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Mensagens from '../components/Mensagens.jsx';
import {
  formatarDataPorExtenso,
  formatarHora,
  formatarHoraCheia,
  hojeISO,
  somarDias,
} from '../formatos.js';

// Lista as horas cheias entre a abertura e o fechamento: '07:00' e '10:00' -> [7, 8, 9]
function horasDoDia(abertura, fechamento) {
  const inicio = Number(abertura.slice(0, 2));
  const fim = Number(fechamento.slice(0, 2));
  return Array.from({ length: fim - inicio }, (_, i) => inicio + i);
}

function Celula({ sala, data, hora, ocupadas, aoEscolher }) {
  const inicio = formatarHoraCheia(hora);
  const fim = formatarHoraCheia(hora + 1);
  const ocupada = ocupadas.find(
    (o) => o.sala_id === sala.id && o.hora_inicio < `${fim}:00` && `${inicio}:00` < o.hora_fim
  );

  if (ocupada) {
    const de = formatarHora(ocupada.hora_inicio);
    const ate = formatarHora(ocupada.hora_fim);
    return (
      <td className="agenda-ocupada">
        <span className="so-leitor">Ocupada das {de} às {ate}</span>
        <span aria-hidden="true">{de}<br />{ate}</span>
      </td>
    );
  }

  if (new Date(`${data}T${inicio}`) <= new Date()) {
    return (
      <td className="agenda-passada">
        <span className="so-leitor">Horário encerrado</span>
        <span aria-hidden="true">–</span>
      </td>
    );
  }

  return (
    <td className="agenda-livre">
      <button
        aria-label={`Reservar ${sala.nome} das ${inicio} às ${fim}`}
        onClick={() => aoEscolher({ salaId: sala.id, data, horaInicio: inicio, horaFim: fim })}
      >
        Livre
      </button>
    </td>
  );
}

export default function Agenda({ aoEscolherHorario }) {
  const [data, setData] = useState(hojeISO());
  const [salas, setSalas] = useState([]);
  const [agenda, setAgenda] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarSalas().then(setSalas).catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    if (!data) return undefined;
    // Ignora a resposta se o usuário já tiver trocado de data.
    let atual = true;
    setErro('');
    api.agendaDoDia(data)
      .then((resposta) => { if (atual) setAgenda(resposta); })
      .catch((err) => { if (atual) setErro(err.message); });
    return () => { atual = false; };
  }, [data]);

  const horas = agenda ? horasDoDia(agenda.abertura, agenda.fechamento) : [];
  const agendaDaData = agenda && agenda.data === data;

  return (
    <section className="cartao">
      <h2>Agenda de disponibilidade</h2>

      <div className="agenda-controles">
        <button
          className="btn-secundario"
          aria-label="Dia anterior"
          disabled={!data || data <= hojeISO()}
          onClick={() => setData(somarDias(data, -1))}
        >
          ‹ Anterior
        </button>
        <label className="campo-inline">
          Data
          <input type="date" min={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <button
          className="btn-secundario"
          aria-label="Próximo dia"
          disabled={!data}
          onClick={() => setData(somarDias(data, 1))}
        >
          Próximo ›
        </button>
      </div>

      <Mensagens erro={erro} />

      {!data && <p className="vazio">Escolha uma data para ver a agenda.</p>}
      {data && !erro && salas.length === 0 && <p className="vazio">Nenhuma sala cadastrada.</p>}

      {agendaDaData && salas.length > 0 && (
        <>
          <p className="agenda-legenda">
            <span className="amostra agenda-livre">Livre</span> clique para reservar
            <span className="amostra agenda-ocupada">Ocupada</span> início e fim da reserva
            <span className="amostra agenda-passada">–</span> já passou
          </p>
          {/* tabIndex permite rolar a tabela pelo teclado em telas pequenas. */}
          <div className="agenda-rolagem" tabIndex={0} role="region" aria-label="Tabela de horários">
            <table className="agenda">
              <caption>Horários de {formatarDataPorExtenso(data)}</caption>
              <thead>
                <tr>
                  <th scope="col">Sala</th>
                  {horas.map((hora) => <th scope="col" key={hora}>{hora}h</th>)}
                </tr>
              </thead>
              <tbody>
                {salas.map((sala) => (
                  <tr key={sala.id}>
                    <th scope="row">{sala.nome}</th>
                    {horas.map((hora) => (
                      <Celula
                        key={hora}
                        sala={sala}
                        data={data}
                        hora={hora}
                        ocupadas={agenda.ocupadas}
                        aoEscolher={aoEscolherHorario}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
