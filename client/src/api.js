// Funções que conversam com a API REST do servidor.
// O Vite encaminha "/api" para http://localhost:3001 (ver vite.config.js).
const BASE = '/api';

// Disparado quando o servidor recusa o token (expirado ou inválido).
// O App escuta este evento e volta para a tela de login.
export const EVENTO_SESSAO_EXPIRADA = 'sessao-expirada';

function getToken() {
  return localStorage.getItem('token');
}

async function lerJson(resposta) {
  try {
    return await resposta.json();
  } catch {
    return null; // resposta sem corpo ou que não é JSON
  }
}

async function request(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(BASE + caminho, { ...opcoes, headers });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }

  const dados = resposta.status === 204 ? null : await lerJson(resposta);

  if (resposta.status === 401 && token) {
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }
  if (!resposta.ok) {
    throw new Error((dados && dados.erro) || 'Não foi possível concluir a operação. Tente novamente.');
  }
  return dados;
}

function comCorpo(metodo, corpo) {
  return { method: metodo, body: JSON.stringify(corpo) };
}

export const api = {
  // Autenticação
  registrar: (corpo) => request('/auth/registrar', comCorpo('POST', corpo)),
  login: (corpo) => request('/auth/login', comCorpo('POST', corpo)),

  // Salas
  listarSalas: () => request('/salas'),
  criarSala: (corpo) => request('/salas', comCorpo('POST', corpo)),
  atualizarSala: (id, corpo) => request(`/salas/${id}`, comCorpo('PUT', corpo)),
  excluirSala: (id) => request(`/salas/${id}`, { method: 'DELETE' }),

  // Reservas
  criarReserva: (corpo) => request('/reservas', comCorpo('POST', corpo)),
  editarReserva: (id, corpo) => request(`/reservas/${id}`, comCorpo('PUT', corpo)),
  minhasReservas: () => request('/reservas/minhas'),
  todasReservas: () => request('/reservas'),
  cancelarReserva: (id) => request(`/reservas/${id}/cancelar`, { method: 'PATCH' }),

  // Agenda
  agendaDoDia: (data) => request(`/agenda?data=${encodeURIComponent(data)}`),

  // Usuários (administrador)
  listarUsuarios: () => request('/usuarios'),
  alterarTipoUsuario: (id, tipo) => request(`/usuarios/${id}/tipo`, comCorpo('PATCH', { tipo })),
  excluirUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};
