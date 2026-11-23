// Área logada: barra lateral, telas, painel de reserva e confirmações.
import { useCallback, useMemo, useState } from 'react';
import { CalendarCheck, CalendarDays, DoorOpen, House, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { api } from './api.js';
import Confirmacao from './components/Confirmacao.jsx';
import Logo from './components/Logo.jsx';
import PainelReserva from './components/PainelReserva.jsx';
import { AcoesContexto } from './contexto/Acoes.js';
import { useAvisos } from './contexto/Avisos.jsx';
import { TIPO_USUARIO, formatarData, formatarHora, iniciais } from './formatos.js';
import Inicio from './pages/Inicio.jsx';
import Salas from './pages/Salas.jsx';
import Agenda from './pages/Agenda.jsx';
import MinhasReservas from './pages/MinhasReservas.jsx';
import Admin from './pages/Admin.jsx';

const TELAS = [
  { id: 'inicio', rotulo: 'Início', icone: House, Tela: Inicio },
  { id: 'salas', rotulo: 'Salas', icone: DoorOpen, Tela: Salas },
  { id: 'agenda', rotulo: 'Agenda', icone: CalendarDays, Tela: Agenda },
  { id: 'reservas', rotulo: 'Minhas reservas', icone: CalendarCheck, Tela: MinhasReservas },
];
const TELA_ADMIN = { id: 'admin', rotulo: 'Administração', icone: ShieldCheck, Tela: Admin };

export default function AreaLogada({ usuario, aoSair }) {
  const avisar = useAvisos();
  const [tela, setTela] = useState('inicio');
  const [versao, setVersao] = useState(0);
  const [painel, setPainel] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  const abrirReserva = useCallback((inicial = {}) => setPainel({ inicial }), []);

  const editarReserva = useCallback((reserva) => {
    const data = reserva.data.slice(0, 10);
    const inicio = formatarHora(reserva.hora_inicio);
    const fim = formatarHora(reserva.hora_fim);
    setPainel({
      reserva,
      inicial: { salaId: reserva.sala_id, data, horaInicio: inicio, horaFim: fim },
      ignorar: { salaId: reserva.sala_id, data, inicio, fim },
    });
  }, []);

  // Abre o diálogo e devolve uma Promise com a resposta (true = confirmou).
  const confirmar = useCallback(
    (opcoes) => new Promise((resolver) => setConfirmacao({ ...opcoes, resolver })),
    []
  );

  const cancelarReserva = useCallback(async (reserva) => {
    const horario = `${formatarHora(reserva.hora_inicio)} às ${formatarHora(reserva.hora_fim)}`;
    const confirmou = await confirmar({
      titulo: 'Cancelar reserva?',
      mensagem: `${reserva.sala_nome}, ${formatarData(reserva.data)}, das ${horario}. O horário fica livre para outras pessoas.`,
      acao: 'Cancelar reserva',
    });
    if (!confirmou) return;
    try {
      await api.cancelarReserva(reserva.id);
      avisar('Reserva cancelada.');
      recarregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }, [confirmar, avisar, recarregar]);

  async function salvarReserva(dados) {
    if (painel.reserva) {
      await api.editarReserva(painel.reserva.id, dados);
      avisar('Reserva alterada com sucesso!');
    } else {
      await api.criarReserva(dados);
      avisar('Reserva realizada com sucesso!');
    }
    setPainel(null);
    recarregar();
  }

  function responder(resposta) {
    confirmacao.resolver(resposta);
    setConfirmacao(null);
  }

  const acoes = useMemo(() => ({
    usuario,
    versao,
    abrirReserva,
    editarReserva,
    cancelarReserva,
    confirmar,
    navegar: setTela,
    recarregar,
  }), [usuario, versao, abrirReserva, editarReserva, cancelarReserva, confirmar, recarregar]);

  const telas = usuario.tipo === 'ADMIN' ? [...TELAS, TELA_ADMIN] : TELAS;
  const { Tela } = telas.find((t) => t.id === tela);

  return (
    <AcoesContexto.Provider value={acoes}>
      <div className="app">
        <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>

        <aside className="barra-lateral">
          <Logo />

          <button type="button" className="btn btn-nova-reserva" onClick={() => abrirReserva()}>
            <Plus size={18} aria-hidden="true" />
            <span>Nova reserva</span>
          </button>

          <nav className="navegacao" aria-label="Principal">
            {telas.map(({ id, rotulo, icone: Icone }) => (
              <button
                key={id}
                type="button"
                aria-current={tela === id ? 'page' : undefined}
                onClick={() => setTela(id)}
              >
                <Icone size={18} aria-hidden="true" />
                <span>{rotulo}</span>
              </button>
            ))}
          </nav>

          <div className="cartao-usuario">
            <span className="avatar" aria-hidden="true">{iniciais(usuario.nome)}</span>
            <div className="cartao-usuario-texto">
              <strong>{usuario.nome}</strong>
              <span>{TIPO_USUARIO[usuario.tipo]}</span>
            </div>
            <button type="button" className="btn-icone" onClick={aoSair} aria-label="Sair" title="Sair">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </aside>

        <main className="conteudo" id="conteudo" tabIndex={-1}>
          <Tela />
        </main>
      </div>

      {painel && (
        <PainelReserva
          edicao={Boolean(painel.reserva)}
          inicial={painel.inicial}
          ignorar={painel.ignorar}
          aoSalvar={salvarReserva}
          aoFechar={() => setPainel(null)}
        />
      )}
      {confirmacao && (
        <Confirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          acao={confirmacao.acao}
          aoResponder={responder}
        />
      )}
    </AcoesContexto.Provider>
  );
}
