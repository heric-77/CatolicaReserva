// Salas: catálogo com busca, filtro por tipo e situação de cada sala agora.
import { useState } from 'react';
import { DoorOpen, Search, Users } from 'lucide-react';
import { api } from '../api.js';
import { proximoHorario, situacaoDaSala } from '../agenda.js';
import CabecalhoPagina from '../components/CabecalhoPagina.jsx';
import IconeSala from '../components/IconeSala.jsx';
import Mensagens from '../components/Mensagens.jsx';
import SituacaoSala from '../components/SituacaoSala.jsx';
import Vazio from '../components/Vazio.jsx';
import { useAcoes } from '../contexto/Acoes.js';
import { TIPO_SALA, agoraHHMM, hojeISO, listaDeRecursos } from '../formatos.js';
import { useCarregar } from '../useCarregar.js';

const FILTROS = [
  { id: 'TODAS', rotulo: 'Todas' },
  { id: 'SALA_ESTUDO', rotulo: 'Salas de estudo' },
  { id: 'LABORATORIO', rotulo: 'Laboratórios' },
];

export default function Salas() {
  const { versao, abrirReserva } = useAcoes();
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('TODAS');
  const hoje = hojeISO();
  const { dados, erro } = useCarregar(
    () => Promise.all([api.listarSalas(), api.agendaDoDia(hoje)]),
    [versao, hoje]
  );
  const [salas, agenda] = dados ?? [[], null];

  const hhmm = agoraHHMM();
  const sugestao = agenda ? proximoHorario(hhmm, agenda) : null;
  const termo = busca.trim().toLowerCase();
  const filtradas = salas.filter((s) => (
    (tipo === 'TODAS' || s.tipo === tipo)
    && (!termo || s.nome.toLowerCase().includes(termo) || (s.recursos || '').toLowerCase().includes(termo))
  ));

  return (
    <>
      <CabecalhoPagina titulo="Salas" descricao="Encontre a sala ideal e veja se ela está livre agora." />

      <div className="barra-filtros">
        <label className="campo-com-icone busca-salas">
          <span className="so-leitor">Buscar sala</span>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por nome ou recurso"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <div className="segmentado" role="group" aria-label="Tipo de sala">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" aria-pressed={tipo === f.id} onClick={() => setTipo(f.id)}>
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      <Mensagens erro={erro} />

      <p className="contagem" role="status">
        {filtradas.length} {filtradas.length === 1 ? 'sala' : 'salas'}
      </p>

      {dados && filtradas.length === 0 && <Vazio icone={DoorOpen}>Nenhuma sala encontrada.</Vazio>}

      <ul className="grade-salas">
        {filtradas.map((sala) => {
          const recursos = listaDeRecursos(sala.recursos);
          return (
            <li key={sala.id} className="cartao-sala">
              <div className="cartao-sala-topo">
                <IconeSala tipo={sala.tipo} />
                {agenda && <SituacaoSala situacao={situacaoDaSala(sala.id, agenda.ocupadas, agenda, hhmm)} />}
              </div>
              <h2>{sala.nome}</h2>
              <p className="detalhe">
                <Users size={14} aria-hidden="true" />
                Até {sala.capacidade} pessoas · {TIPO_SALA[sala.tipo]}
              </p>
              {recursos.length > 0 ? (
                <ul className="recursos" aria-label={`Recursos de ${sala.nome}`}>
                  {recursos.map((r) => <li key={r}>{r}</li>)}
                </ul>
              ) : (
                <p className="sem-recursos">Sem recursos extras</p>
              )}
              <button
                type="button"
                className="btn btn-claro"
                aria-label={`Reservar ${sala.nome}`}
                onClick={() => abrirReserva({ salaId: sala.id, data: hoje, ...sugestao })}
              >
                Reservar
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
