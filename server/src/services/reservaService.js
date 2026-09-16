// ReservaService - regras de negócio das reservas.
// Aqui fica a regra central do sistema: NÃO permitir duas reservas
// para a mesma sala em horários que se sobrepõem (RF06).
const reservaRepository = require('../repositories/reservaRepository');
const salaRepository = require('../repositories/salaRepository');

// Verifica se já existe uma reserva ativa que conflita com o horário pedido.
async function existeConflito(salaId, data, horaInicio, horaFim) {
  const reservas = await reservaRepository.buscarPorSalaEData(salaId, data);
  // Dois intervalos [inicioA, fimA) e [inicioB, fimB) se sobrepõem
  // quando inicioA < fimB E inicioB < fimA. As horas 'HH:MM' comparam por texto.
  return reservas.some(
    (r) => horaInicio < r.hora_fim && r.hora_inicio < horaFim
  );
}

async function criar({ usuarioId, salaId, data, horaInicio, horaFim }) {
  if (!salaId || !data || !horaInicio || !horaFim) {
    const erro = new Error('Sala, data, hora de início e hora de fim são obrigatórias.');
    erro.status = 400;
    throw erro;
  }
  if (horaFim <= horaInicio) {
    const erro = new Error('A hora de fim deve ser maior que a hora de início.');
    erro.status = 400;
    throw erro;
  }

  const sala = await salaRepository.buscarPorId(salaId);
  if (!sala) {
    const erro = new Error('Sala não encontrada.');
    erro.status = 404;
    throw erro;
  }

  if (await existeConflito(salaId, data, horaInicio, horaFim)) {
    const erro = new Error('Já existe uma reserva para esta sala nesse horário.');
    erro.status = 409;
    throw erro;
  }

  return reservaRepository.salvar({ usuarioId, salaId, data, horaInicio, horaFim });
}

async function cancelar(id, usuario) {
  const reserva = await reservaRepository.buscarPorId(id);
  if (!reserva) {
    const erro = new Error('Reserva não encontrada.');
    erro.status = 404;
    throw erro;
  }
  // Só o dono da reserva ou um administrador pode cancelar (RNF03 - Segurança).
  if (reserva.usuario_id !== usuario.id && usuario.tipo !== 'ADMIN') {
    const erro = new Error('Você não tem permissão para cancelar esta reserva.');
    erro.status = 403;
    throw erro;
  }
  return reservaRepository.atualizarStatus(id, 'CANCELADA');
}

async function listarMinhas(usuarioId) {
  return reservaRepository.listarPorUsuario(usuarioId);
}

async function listarTodas() {
  return reservaRepository.listarTodas();
}

module.exports = { existeConflito, criar, cancelar, listarMinhas, listarTodas };
