-- Banco de dados do CatólicaReserva
CREATE DATABASE IF NOT EXISTS catolicareserva
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE catolicareserva;

-- Usuários (aluno, professor ou administrador)
CREATE TABLE IF NOT EXISTS usuarios (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nome     VARCHAR(120) NOT NULL,
  email    VARCHAR(120) NOT NULL UNIQUE,
  senha    VARCHAR(255) NOT NULL, -- guardada com hash (bcrypt)
  tipo     ENUM('ALUNO', 'PROFESSOR', 'ADMIN') NOT NULL DEFAULT 'ALUNO'
);

-- Salas de estudo e laboratórios
CREATE TABLE IF NOT EXISTS salas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  tipo        ENUM('SALA_ESTUDO', 'LABORATORIO') NOT NULL,
  capacidade  INT NOT NULL,
  recursos    VARCHAR(255) DEFAULT ''
);

-- Reservas de salas
CREATE TABLE IF NOT EXISTS reservas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL,
  sala_id      INT NOT NULL,
  data         DATE NOT NULL,
  hora_inicio  TIME NOT NULL,
  hora_fim     TIME NOT NULL,
  status       ENUM('ATIVA', 'CANCELADA') NOT NULL DEFAULT 'ATIVA',
  CONSTRAINT fk_reserva_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_reserva_sala    FOREIGN KEY (sala_id)    REFERENCES salas(id)
);
