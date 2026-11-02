// Formulário de reserva, usado para criar e para editar.
import { useEffect, useState } from 'react';
import Mensagens from './Mensagens.jsx';
import { TIPO_SALA, hojeISO } from '../formatos.js';
import { validarReserva } from '../validacoes.js';

export default function FormularioReserva({ salas, inicial = {}, rotulo, aoEnviar, aoDesistir, focar }) {
  const [salaId, setSalaId] = useState(inicial.salaId ? String(inicial.salaId) : '');
  const [data, setData] = useState(inicial.data || '');
  const [horaInicio, setHoraInicio] = useState(inicial.horaInicio || '');
  const [horaFim, setHoraFim] = useState(inicial.horaFim || '');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // As salas podem chegar depois do formulário aparecer.
  useEffect(() => {
    if (!salaId && salas.length) setSalaId(String(salas[0].id));
  }, [salas, salaId]);

  async function enviar(e) {
    e.preventDefault();
    const dados = { salaId: Number(salaId), data, horaInicio, horaFim };
    const problema = validarReserva(dados);
    setErro(problema || '');
    if (problema) return;

    setEnviando(true);
    try {
      await aoEnviar(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="formulario" noValidate>
      <label>
        Sala
        <select value={salaId} onChange={(e) => setSalaId(e.target.value)} autoFocus={focar}>
          {salas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} ({TIPO_SALA[s.tipo]})
            </option>
          ))}
        </select>
      </label>

      <label>
        Data
        <input type="date" min={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
      </label>

      <div className="linha">
        <label>
          Início
          <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        </label>
        <label>
          Fim
          <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
        </label>
      </div>

      <Mensagens erro={erro} />

      <div className="botoes-formulario">
        <button className="btn" disabled={enviando || salas.length === 0}>
          {enviando ? 'Aguarde...' : rotulo}
        </button>
        {aoDesistir && (
          <button type="button" className="btn-secundario" onClick={aoDesistir}>
            Voltar
          </button>
        )}
      </div>
    </form>
  );
}
