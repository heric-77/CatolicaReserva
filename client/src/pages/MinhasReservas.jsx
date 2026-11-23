// Minhas reservas: próximas e histórico, agrupadas por dia.
import { useState } from 'react';
import { CalendarX, History, Plus } from 'lucide-react';
import { api } from '../api.js';
import { agruparPorData, separarReservas } from '../agenda.js';
import CabecalhoPagina from '../components/CabecalhoPagina.jsx';
import ItemReserva from '../components/ItemReserva.jsx';
import Mensagens from '../components/Mensagens.jsx';
import Vazio from '../components/Vazio.jsx';
import { useAcoes } from '../contexto/Acoes.js';
import { formatarData, rotuloDoDia } from '../formatos.js';
import { useCarregar } from '../useCarregar.js';

export default function MinhasReservas() {
  const { versao, abrirReserva, editarReserva, cancelarReserva } = useAcoes();
  const [aba, setAba] = useState('proximas');
  const { dados, erro } = useCarregar(() => api.minhasReservas(), [versao]);

  const { proximas, historico } = separarReservas(dados ?? []);
  const lista = aba === 'proximas' ? proximas : historico;
  const grupos = agruparPorData(lista);

  const novaReserva = (
    <button type="button" className="btn" onClick={() => abrirReserva()}>
      <Plus size={16} aria-hidden="true" />
      Nova reserva
    </button>
  );

  return (
    <>
      <CabecalhoPagina titulo="Minhas reservas" descricao="Acompanhe, altere ou cancele as suas reservas.">
        {novaReserva}
      </CabecalhoPagina>

      <div className="segmentado" role="group" aria-label="Quais reservas mostrar">
        <button type="button" aria-pressed={aba === 'proximas'} onClick={() => setAba('proximas')}>
          Próximas <span className="contador">{proximas.length}</span>
        </button>
        <button type="button" aria-pressed={aba === 'historico'} onClick={() => setAba('historico')}>
          Histórico <span className="contador">{historico.length}</span>
        </button>
      </div>

      <Mensagens erro={erro} />

      {dados && grupos.length === 0 && (
        aba === 'proximas'
          ? <Vazio icone={CalendarX} acao={novaReserva}>Você ainda não tem reservas futuras.</Vazio>
          : <Vazio icone={History}>Nenhuma reserva passada ou cancelada.</Vazio>
      )}

      {grupos.map((grupo) => (
        <section key={grupo.data} className="grupo-dia" aria-label={rotuloDoDia(grupo.data)}>
          <h2 className="grupo-dia-titulo">
            {rotuloDoDia(grupo.data)} <span>{formatarData(grupo.data)}</span>
          </h2>
          <ul className="lista-reservas">
            {grupo.reservas.map((r) => (
              <ItemReserva
                key={r.id}
                reserva={r}
                mostrarData={false}
                aoEditar={editarReserva}
                aoCancelar={cancelarReserva}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
