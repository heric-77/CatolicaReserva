// Cadastro, edição e exclusão de salas.
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Mensagens from '../../components/Mensagens.jsx';
import { TIPO_SALA } from '../../formatos.js';
import { validarSala } from '../../validacoes.js';

const SALA_VAZIA = { nome: '', tipo: 'SALA_ESTUDO', capacidade: '', recursos: '' };

export default function AdminSalas() {
  const [salas, setSalas] = useState([]);
  const [campos, setCampos] = useState(SALA_VAZIA);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  async function carregar() {
    try {
      setSalas(await api.listarSalas());
    } catch (err) {
      setErro(err.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  function alterarCampo(nome, valor) {
    setCampos((atuais) => ({ ...atuais, [nome]: valor }));
  }

  function limparFormulario() {
    setCampos(SALA_VAZIA);
    setEditandoId(null);
  }

  function editar(sala) {
    setErro('');
    setAviso('');
    setEditandoId(sala.id);
    setCampos({
      nome: sala.nome,
      tipo: sala.tipo,
      capacidade: String(sala.capacidade),
      recursos: sala.recursos,
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setAviso('');
    const problema = validarSala(campos);
    setErro(problema || '');
    if (problema) return;

    try {
      const dados = { ...campos, nome: campos.nome.trim(), capacidade: Number(campos.capacidade) };
      if (editandoId) {
        await api.atualizarSala(editandoId, dados);
        setAviso('Sala alterada com sucesso!');
      } else {
        await api.criarSala(dados);
        setAviso('Sala cadastrada com sucesso!');
      }
      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function excluir(sala) {
    const aviso = `Excluir a sala "${sala.nome}"?\n\nTodas as reservas desta sala também serão excluídas, inclusive as de outros usuários. Isso não pode ser desfeito.`;
    if (!window.confirm(aviso)) return;
    setErro('');
    setAviso('');
    try {
      await api.excluirSala(sala.id);
      setAviso('Sala excluída.');
      if (editandoId === sala.id) limparFormulario();
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="grade">
      <section className="cartao">
        <h2>{editandoId ? 'Editar sala' : 'Nova sala'}</h2>
        <form onSubmit={salvar} className="formulario" noValidate>
          <label>
            Nome
            <input value={campos.nome} onChange={(e) => alterarCampo('nome', e.target.value)} />
          </label>
          <label>
            Tipo
            <select value={campos.tipo} onChange={(e) => alterarCampo('tipo', e.target.value)}>
              {Object.entries(TIPO_SALA).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </label>
          <label>
            Capacidade
            <input
              type="number"
              min="1"
              step="1"
              value={campos.capacidade}
              onChange={(e) => alterarCampo('capacidade', e.target.value)}
            />
          </label>
          <label>
            Recursos
            <input value={campos.recursos} onChange={(e) => alterarCampo('recursos', e.target.value)} />
          </label>

          <Mensagens erro={erro} aviso={aviso} />

          <div className="botoes-formulario">
            <button className="btn">{editandoId ? 'Salvar alterações' : 'Cadastrar sala'}</button>
            {editandoId && (
              <button type="button" className="btn-secundario" onClick={limparFormulario}>
                Voltar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="cartao">
        <h2>Salas cadastradas</h2>
        {salas.length === 0 && <p className="vazio">Nenhuma sala cadastrada.</p>}
        <ul className="lista-reservas">
          {salas.map((s) => (
            <li key={s.id}>
              <div>
                <strong>{s.nome}</strong>
                <div className="detalhe">{TIPO_SALA[s.tipo]} · {s.capacidade} lugares</div>
                <div className="detalhe">{s.recursos || 'sem recursos'}</div>
              </div>
              <div className="acoes">
                <button className="btn-secundario" aria-label={`Editar ${s.nome}`} onClick={() => editar(s)}>
                  Editar
                </button>
                <button className="btn-secundario" aria-label={`Excluir ${s.nome}`} onClick={() => excluir(s)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
