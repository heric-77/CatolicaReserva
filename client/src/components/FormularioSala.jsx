// Formulário de sala (cadastro e edição), usado no painel lateral da administração.
import { useState } from 'react';
import Mensagens from './Mensagens.jsx';
import { TIPO_SALA } from '../formatos.js';
import { validarSala } from '../validacoes.js';

const SALA_VAZIA = { nome: '', tipo: 'SALA_ESTUDO', capacidade: '', recursos: '' };

export default function FormularioSala({ sala, aoEnviar, aoDesistir }) {
  const [campos, setCampos] = useState(
    sala
      ? { nome: sala.nome, tipo: sala.tipo, capacidade: String(sala.capacidade), recursos: sala.recursos }
      : SALA_VAZIA
  );
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function alterarCampo(nome, valor) {
    setCampos((atuais) => ({ ...atuais, [nome]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    const problema = validarSala(campos);
    setErro(problema || '');
    if (problema) return;

    setEnviando(true);
    try {
      await aoEnviar({ ...campos, nome: campos.nome.trim(), capacidade: Number(campos.capacidade) });
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  let rotulo = sala ? 'Salvar alterações' : 'Cadastrar sala';
  if (enviando) rotulo = 'Aguarde...';

  return (
    <form onSubmit={enviar} className="formulario" noValidate>
      <label>
        Nome
        <input placeholder="Ex.: Sala de Estudos 3" value={campos.nome} onChange={(e) => alterarCampo('nome', e.target.value)} />
      </label>
      <label>
        Tipo
        <select value={campos.tipo} onChange={(e) => alterarCampo('tipo', e.target.value)}>
          {Object.entries(TIPO_SALA).map(([valor, nome]) => (
            <option key={valor} value={valor}>{nome}</option>
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
        <input
          placeholder="Separe por vírgula: projetor, quadro branco"
          value={campos.recursos}
          onChange={(e) => alterarCampo('recursos', e.target.value)}
        />
      </label>

      <Mensagens erro={erro} />

      <div className="botoes-formulario">
        <button type="button" className="btn-secundario" onClick={aoDesistir}>Voltar</button>
        <button type="submit" className="btn" disabled={enviando}>{rotulo}</button>
      </div>
    </form>
  );
}
