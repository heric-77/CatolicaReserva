// Lê as variáveis de ambiente (.env) em um único lugar.
// Nenhuma outra parte do código acessa process.env diretamente.
require('dotenv').config();

module.exports = {
  porta: Number(process.env.PORT) || 3001,
  banco: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'catolicareserva',
  },
  jwt: {
    segredo: process.env.JWT_SECRET || 'troque-este-segredo',
    expiracao: '8h',
  },
  // Limites das regras de reserva.
  reservas: {
    abertura: '07:00',
    fechamento: '22:00',
    duracaoMaximaEmMinutos: 4 * 60,
    antecedenciaMaximaEmDias: 30,
  },
};
