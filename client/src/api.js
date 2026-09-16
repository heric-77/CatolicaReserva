// Funções que conversam com a API REST do servidor.
// O Vite encaminha "/api" para http://localhost:3001 (ver vite.config.js).
const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(BASE + caminho, { ...opcoes, headers });
  const dados = resposta.status === 204 ? null : await resposta.json();

  if (!resposta.ok) {
    throw new Error((dados && dados.erro) || 'Erro na requisição.');
  }
  return dados;
}

export const api = {
  // Autenticação
  registrar: (corpo) => request('/auth/registrar', { method: 'POST', body: JSON.stringify(corpo) }),
  login: (corpo) => request('/auth/login', { method: 'POST', body: JSON.stringify(corpo) }),

  // Salas
  listarSalas: () => request('/salas'),

  // Reservas
  criarReserva: (corpo) => request('/reservas', { method: 'POST', body: JSON.stringify(corpo) }),
  minhasReservas: () => request('/reservas/minhas'),
  cancelarReserva: (id) => request(`/reservas/${id}/cancelar`, { method: 'PATCH' }),
};
