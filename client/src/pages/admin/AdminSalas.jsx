// Administração das salas: lista, cadastro, edição (painel lateral) e exclusão.
import { useState } from 'react';
import { DoorOpen, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../../api.js';
import Dialogo from '../../components/Dialogo.jsx';
import FormularioSala from '../../components/FormularioSala.jsx';
import IconeSala from '../../components/IconeSala.jsx';
import Mensagens from '../../components/Mensagens.jsx';
import Vazio from '../../components/Vazio.jsx';
import { useAcoes } from '../../contexto/Acoes.js';
import { useAvisos } from '../../contexto/Avisos.jsx';
import { TIPO_SALA } from '../../formatos.js';
import { useCarregar } from '../../useCarregar.js';

export default function AdminSalas() {
  const { versao, confirmar, recarregar } = useAcoes();
  const avisar = useAvisos();
  // null = painel fechado; {} = nova sala; { sala } = edição
  const [painel, setPainel] = useState(null);
  const { dados, erro } = useCarregar(() => api.listarSalas(), [versao]);
  const salas = dados ?? [];

  async function salvar(campos) {
    if (painel.sala) {
      await api.atualizarSala(painel.sala.id, campos);
      avisar('Sala alterada com sucesso!');
    } else {
      await api.criarSala(campos);
      avisar('Sala cadastrada com sucesso!');
    }
    setPainel(null);
    recarregar();
  }

  async function excluir(sala) {
    const confirmou = await confirmar({
      titulo: `Excluir "${sala.nome}"?`,
      mensagem: 'Todas as reservas desta sala também serão excluídas, inclusive as de outros usuários. Isso não pode ser desfeito.',
      acao: 'Excluir sala',
    });
    if (!confirmou) return;
    try {
      await api.excluirSala(sala.id);
      avisar('Sala excluída.');
      recarregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  return (
    <section className="cartao">
      <div className="cartao-cabecalho com-acao">
        <div>
          <h2>Salas cadastradas</h2>
          <p>{salas.length} {salas.length === 1 ? 'sala' : 'salas'}</p>
        </div>
        <button type="button" className="btn" onClick={() => setPainel({})}>
          <Plus size={16} aria-hidden="true" />
          Nova sala
        </button>
      </div>

      <Mensagens erro={erro} />
      {dados && salas.length === 0 && <Vazio icone={DoorOpen}>Nenhuma sala cadastrada.</Vazio>}

      <ul className="lista-reservas">
        {salas.map((s) => (
          <li key={s.id}>
            <IconeSala tipo={s.tipo} />
            <div className="item-reserva-info">
              <strong>{s.nome}</strong>
              <div className="detalhe">
                <Users size={14} aria-hidden="true" />
                {TIPO_SALA[s.tipo]} · {s.capacidade} lugares
              </div>
              <div className="detalhe">{s.recursos || 'sem recursos'}</div>
            </div>
            <div className="acoes">
              <button
                type="button"
                className="btn-secundario"
                aria-label={`Editar ${s.nome}`}
                onClick={() => setPainel({ sala: s })}
              >
                <Pencil size={14} aria-hidden="true" />
                Editar
              </button>
              <button
                type="button"
                className="btn-secundario perigo"
                aria-label={`Excluir ${s.nome}`}
                onClick={() => excluir(s)}
              >
                <Trash2 size={14} aria-hidden="true" />
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {painel && (
        <Dialogo
          titulo={painel.sala ? 'Editar sala' : 'Nova sala'}
          descricao={painel.sala ? 'Altere os dados e salve.' : 'Cadastre uma sala de estudo ou laboratório.'}
          aoFechar={() => setPainel(null)}
        >
          <FormularioSala sala={painel.sala} aoEnviar={salvar} aoDesistir={() => setPainel(null)} />
        </Dialogo>
      )}
    </section>
  );
}
