// Script para criar o banco, as tabelas e inserir os dados iniciais.
// Uso: npm run db:init
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  // Conecta SEM selecionar um banco (o schema.sql cria o banco).
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const dir = path.join(__dirname, '..', 'src', 'database');
  const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8');

  console.log('Criando banco e tabelas...');
  await conexao.query(schema);

  console.log('Inserindo dados iniciais...');
  await conexao.query(seed);

  // Gera o hash real da senha do administrador (admin123).
  const hash = await bcrypt.hash('admin123', 10);
  await conexao.query(
    'UPDATE catolicareserva.usuarios SET senha = ? WHERE email = ?',
    [hash, 'admin@catolicasc.edu.br']
  );

  console.log('Banco inicializado com sucesso.');
  console.log('Login do admin -> email: admin@catolicasc.edu.br | senha: admin123');
  await conexao.end();
}

main().catch((err) => {
  console.error('Falha ao inicializar o banco:', err.message);
  process.exit(1);
});
