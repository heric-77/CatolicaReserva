// Painel lateral de reserva (nova ou edição). Abre por cima de qualquer tela.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Dialogo from './Dialogo.jsx';
import FormularioReserva from './FormularioReserva.jsx';
import Mensagens from './Mensagens.jsx';

export default function PainelReserva({ edicao, inicial, ignorar, aoSalvar, aoFechar }) {
  const [salas, setSalas] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarSalas().then(setSalas).catch((err) => setErro(err.message));
  }, []);

  return (
    <Dialogo
      titulo={edicao ? 'Editar reserva' : 'Nova reserva'}
      descricao={edicao ? 'Altere a sala, o dia ou o horário.' : 'Escolha a sala, o dia e o horário.'}
      aoFechar={aoFechar}
    >
      <Mensagens erro={erro} />
      <FormularioReserva
        salas={salas}
        inicial={inicial}
        ignorar={ignorar}
        rotulo={edicao ? 'Salvar alterações' : 'Reservar'}
        aoEnviar={aoSalvar}
        aoDesistir={aoFechar}
      />
    </Dialogo>
  );
}
