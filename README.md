# CatólicaReserva — Sistema de Reserva de Salas de Estudo e Laboratórios

**Disciplina:** Projeto e Arquitetura de Software
**Integrantes:** Gustavo Schmitt e Heric Moreira Ribeiro

Sistema web para reservar salas de estudo e laboratórios, evitando conflitos de horário.
Arquitetura **cliente-servidor**: um cliente web (React) que conversa por uma API REST
com um servidor (Node.js + Express), que por sua vez acessa um banco de dados MySQL.

> O sistema funciona ponta a ponta; o que ainda falta está listado em "Status do desenvolvimento".

## Estrutura do projeto

```
CatolicaReserva/
├── client/          # Cliente web (React + Vite)
├── server/          # Servidor / API REST (Node.js + Express + MySQL)
└── documentacao/    # Documentação, modelo C4 e apresentação
```

A pasta `server/` segue a divisão em camadas do modelo C4
(**Controller → Service → Repository**) e os princípios **SOLID**
(ver [documentacao/SOLID.md](./documentacao/SOLID.md)):

```
server/src/
├── config/          # Leitura das variáveis de ambiente (.env)
├── dominio/         # Regras de negócio puras (não conhece Express, MySQL, bcrypt nem JWT)
│   ├── entidades/   #   Reserva, Sala, Usuario
│   ├── contratos/   #   Interfaces: repositórios, hash, token, regras
│   ├── regras/      #   Regras de reserva e de cancelamento (uma classe por regra)
│   └── erros.js     #   Erros de domínio (sem status HTTP)
├── services/        # Casos de uso: ReservaService, SalaService, UsuarioService
├── infra/           # Implementações concretas: MySQL, bcrypt, JWT
├── http/            # Controllers, rotas, middlewares e formatação do JSON
├── database/        # schema.sql e seed.sql
├── container.js     # Monta e injeta todas as dependências (Composition Root)
├── app.js           # Configuração do Express
└── server.js        # Ponto de entrada
server/test/         # Testes automatizados (npm test)
```

## Pré-requisitos

- Node.js 18 ou superior
- MySQL 8 (rodando localmente)

## Como rodar

### 1. Banco de dados e servidor

```bash
cd server
cp .env.example .env      # ajuste usuário/senha do MySQL no arquivo .env
npm install
npm run db:init           # cria o banco, as tabelas e os dados iniciais
npm run dev               # sobe a API em http://localhost:3001
npm test                  # roda os testes automatizados (não precisa do banco)
```

O `db:init` cria um administrador:
**e-mail:** `admin@catolicasc.edu.br` · **senha:** `admin123`

### 2. Cliente web

Em outro terminal:

```bash
cd client
npm install
npm run dev               # abre o cliente em http://localhost:5173
```

Acesse `http://localhost:5173`, crie uma conta (ou entre com o admin) e faça uma reserva.

## Endpoints da API

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/api/auth/registrar` | Cria um aluno ou professor | público |
| POST | `/api/auth/login` | Faz login e retorna o token | público |
| GET | `/api/salas` | Lista as salas | logado |
| POST | `/api/salas` | Cadastra uma sala | admin |
| PUT | `/api/salas/:id` | Edita uma sala | admin |
| DELETE | `/api/salas/:id` | Exclui uma sala e as reservas dela | admin |
| POST | `/api/reservas` | Cria uma reserva (valida as regras) | logado |
| PUT | `/api/reservas/:id` | Edita uma reserva ativa | dono / admin |
| GET | `/api/reservas/minhas` | Lista as reservas do usuário | logado |
| PATCH | `/api/reservas/:id/cancelar` | Cancela uma reserva | dono / admin |
| GET | `/api/reservas` | Lista todas as reservas | admin |
| GET | `/api/agenda?data=AAAA-MM-DD` | Horários ocupados de todas as salas na data | logado |
| GET | `/api/usuarios` | Lista os usuários | admin |
| PATCH | `/api/usuarios/:id/tipo` | Altera o tipo de um usuário | admin |
| DELETE | `/api/usuarios/:id` | Exclui um usuário e as reservas dele | admin |

## Regras de reserva

Os limites ficam em `server/src/config/ambiente.js`:

- Horário de funcionamento: das 07:00 às 22:00
- Duração máxima de uma reserva: 4 horas
- Antecedência máxima: 30 dias (não é possível reservar um horário que já passou)

## Status do desenvolvimento

### Já implementado
- Cadastro e login de usuários, com senha criptografada (bcrypt) e token JWT
- Arquitetura em camadas seguindo os princípios SOLID
- Reserva com bloqueio de conflito de horário, edição e cancelamento
- Regras de horário de funcionamento, duração máxima e antecedência
- Agenda visual de disponibilidade por sala e horário
- Administração: painel com todas as reservas, gestão de salas e de usuários
- Validações e mensagens de erro no cliente, incluindo aviso de sessão expirada
- Layout responsivo e melhorias de acessibilidade
- Testes automatizados de unidade (`npm test` em `server/`)
- Banco de dados MySQL com script de criação e dados iniciais

### Ainda a fazer
- Testes automatizados de integração
- Configuração de implantação (deploy)

## Documentação

A documentação completa (contexto e visão do produto, requisitos, arquitetura,
**modelo C4 completo** — Contexto, Container, Componentes — e diagrama de classes)
está na pasta [`documentacao/`](./documentacao/DOCUMENTACAO.md).
