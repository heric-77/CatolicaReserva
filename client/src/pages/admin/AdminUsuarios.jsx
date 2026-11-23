// Administração: usuários (alterar o tipo de acesso e excluir).
import { Trash2 } from 'lucide-react';
import { api } from '../../api.js';
import Mensagens from '../../components/Mensagens.jsx';
import { useAcoes } from '../../contexto/Acoes.js';
import { useAvisos } from '../../contexto/Avisos.jsx';
import { TIPO_USUARIO, iniciais } from '../../formatos.js';
import { useCarregar } from '../../useCarregar.js';

export default function AdminUsuarios() {
  const { usuario: eu, versao, confirmar, recarregar } = useAcoes();
  const avisar = useAvisos();
  const { dados, erro } = useCarregar(() => api.listarUsuarios(), [versao]);
  const usuarios = dados ?? [];

  async function alterarTipo(usuario, tipo) {
    try {
      await api.alterarTipoUsuario(usuario.id, tipo);
      avisar(`${usuario.nome} agora é ${TIPO_USUARIO[tipo]}.`);
    } catch (err) {
      avisar(err.message, 'erro');
    }
    recarregar();
  }

  async function excluir(usuario) {
    const confirmou = await confirmar({
      titulo: `Excluir ${usuario.nome}?`,
      mensagem: 'Todas as reservas deste usuário também serão excluídas. Isso não pode ser desfeito.',
      acao: 'Excluir usuário',
    });
    if (!confirmou) return;
    try {
      await api.excluirUsuario(usuario.id);
      avisar('Usuário excluído.');
      recarregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  return (
    <section className="cartao">
      <div className="cartao-cabecalho">
        <h2>Usuários</h2>
        <p>Altere o tipo de acesso ou exclua usuários. Você não pode alterar a sua própria conta.</p>
      </div>
      <Mensagens erro={erro} />
      <ul className="lista-reservas">
        {usuarios.map((u) => (
          <li key={u.id}>
            <span className="avatar" aria-hidden="true">{iniciais(u.nome)}</span>
            <div className="item-reserva-info">
              <strong>{u.nome}{u.id === eu.id && ' (você)'}</strong>
              <div className="detalhe">{u.email}</div>
            </div>
            <div className="acoes">
              {u.id === eu.id ? (
                <span className="tag">{TIPO_USUARIO[u.tipo]}</span>
              ) : (
                <>
                  <select
                    aria-label={`Tipo de ${u.nome}`}
                    value={u.tipo}
                    onChange={(e) => alterarTipo(u, e.target.value)}
                  >
                    {Object.entries(TIPO_USUARIO).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>{rotulo}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secundario perigo"
                    aria-label={`Excluir ${u.nome}`}
                    onClick={() => excluir(u)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Excluir
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
