// Cria o "pool" de conexões com o MySQL, reaproveitado por todos os repositórios.
const mysql = require('mysql2/promise');

function criarPool(configBanco) {
  return mysql.createPool({
    ...configBanco,
    dateStrings: ['DATE'], // devolve as datas como 'AAAA-MM-DD', sem conversão de fuso
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = { criarPool };
