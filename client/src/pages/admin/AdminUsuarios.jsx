// Gestão de usuários: alterar o tipo e excluir.
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Mensagens from '../../components/Mensagens.jsx';
import { TIPO_USUARIO } from '../../formatos.js';

export default function AdminUsuarios({ usuario: eu }) {
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  async function carregar() {
    try {
      setUsuarios(await api.listarUsuarios());
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function alterarTipo(usuario, tipo) {
    setErro('');
    setAviso('');
    try {
      await api.alterarTipoUsuario(usuario.id, tipo);
      setAviso(`${usuario.nome} agora é ${TIPO_USUARIO[tipo]}.`);
    } catch (err) {
      setErro(err.message);
    }
    carregar();
  }

  async function excluir(usuario) {
    const aviso = `Excluir o usuário ${usuario.nome}?\n\nTodas as reservas deste usuário também serão excluídas. Isso não pode ser desfeito.`;
    if (!window.confirm(aviso)) return;
    setErro('');
    setAviso('');
    try {
      await api.excluirUsuario(usuario.id);
      setAviso('Usuário excluído.');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <section className="cartao">
      <h2>Usuários</h2>
      <Mensagens erro={erro} aviso={aviso} />
      <ul className="lista-reservas">
        {usuarios.map((u) => (
          <li key={u.id}>
            <div>
              <strong>{u.nome}{u.id === eu.id && ' (você)'}</strong>
              <div className="detalhe">{u.email}</div>
            </div>
            <div className="acoes">
              {u.id === eu.id ? (
                <span className="detalhe">{TIPO_USUARIO[u.tipo]}</span>
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
                  <button className="btn-secundario" aria-label={`Excluir ${u.nome}`} onClick={() => excluir(u)}>
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
