// Apresentadores: transformam as entidades do domínio no JSON que a API devolve.
// Formatar a resposta é responsabilidade da camada HTTP, não dos services.
// Os nomes dos campos (ex: hora_inicio) foram mantidos para o cliente React continuar funcionando.

function apresentarUsuario(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo };
}

function apresentarSala(sala) {
  return {
    id: sala.id,
    nome: sala.nome,
    tipo: sala.tipo,
    capacidade: sala.capacidade,
    recursos: sala.recursos,
  };
}

function apresentarReserva(reserva) {
  return {
    id: reserva.id,
    usuario_id: reserva.usuarioId,
    sala_id: reserva.salaId,
    data: reserva.data,
    hora_inicio: reserva.horaInicio,
    hora_fim: reserva.horaFim,
    status: reserva.status,
    sala_nome: reserva.salaNome,
    usuario_nome: reserva.usuarioNome,
  };
}

module.exports = { apresentarUsuario, apresentarSala, apresentarReserva };
