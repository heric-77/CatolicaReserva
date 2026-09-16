USE catolicareserva;

-- Usuário administrador inicial.
-- A senha em texto puro é: admin123
-- (o hash abaixo foi gerado com bcrypt; ao usar o script initDb ele é recriado)
INSERT INTO usuarios (nome, email, senha, tipo) VALUES
  ('Administrador', 'admin@catolicasc.edu.br', '$2a$10$PLACEHOLDERPLACEHOLDERPLACEHOLDERPLACEHOLDERPLACEHO', 'ADMIN')
ON DUPLICATE KEY UPDATE nome = nome;

-- Algumas salas de exemplo
INSERT INTO salas (nome, tipo, capacidade, recursos) VALUES
  ('Sala de Estudo 101', 'SALA_ESTUDO', 6, 'Mesa, quadro branco'),
  ('Sala de Estudo 102', 'SALA_ESTUDO', 4, 'Mesa'),
  ('Laboratório de Informática 1', 'LABORATORIO', 30, '30 computadores, projetor'),
  ('Laboratório de Redes', 'LABORATORIO', 20, '20 computadores, switches, projetor');
