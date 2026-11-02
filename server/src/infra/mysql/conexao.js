// Cria o "pool" de conexões com o MySQL, reaproveitado por todos os repositórios.
const mysql = require('mysql2/promise');

function criarPool(configBanco) {
  return mysql.createPool({
    ...configBanco,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = { criarPool };
