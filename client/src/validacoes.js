// Validações feitas antes de enviar os dados, para o usuário ter a resposta na hora.
// Cada função devolve a mensagem de erro ou null. O servidor continua validando
// tudo, e os limites configuráveis (como a duração máxima) ficam só com ele.

export function validarReserva({ salaId, data, horaInicio, horaFim }, agora = new Date()) {
  if (!salaId) return 'Escolha uma sala.';
  if (!data) return 'Informe a data.';
  if (!horaInicio || !horaFim) return 'Informe a hora de início e a hora de fim.';
  if (horaFim <= horaInicio) return 'A hora de fim deve ser maior que a hora de início.';
  if (new Date(`${data}T${horaInicio}`) <= agora) {
    return 'Escolha uma data e um horário que ainda não passaram.';
  }
  return null;
}

export function validarSala({ nome, capacidade }) {
  if (!nome.trim()) return 'Informe o nome da sala.';
  if (!Number.isInteger(Number(capacidade)) || Number(capacidade) <= 0) {
    return 'A capacidade deve ser um número inteiro maior que zero.';
  }
  return null;
}

export function validarCadastro({ nome }) {
  if (!nome.trim()) return 'Informe o seu nome.';
  return null;
}
