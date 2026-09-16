# CatólicaReserva — Sistema de Reserva de Salas de Estudo e Laboratórios

**Disciplina:** Projeto e Arquitetura de Software
**Integrantes:** Gustavo Schmitt e Heric Moreira Ribeiro

Sistema web para reservar salas de estudo e laboratórios, evitando conflitos de horário.
Arquitetura **cliente-servidor**: um cliente web (React) que conversa por uma API REST
com um servidor (Node.js + Express), que por sua vez acessa um banco de dados MySQL.

> Este repositório contém uma **entrega parcial (~40%)** do sistema. O núcleo já funciona
> ponta a ponta; o que falta está listado em "Status do desenvolvimento".

## Estrutura do projeto

```
CatolicaReserva/
├── client/          # Cliente web (React + Vite)
├── server/          # Servidor / API REST (Node.js + Express + MySQL)
└── documentacao/    # Documentação, modelo C4 e apresentação
```

A pasta `server/` segue a divisão em camadas do modelo C4
(**Controller → Service → Repository**):

```
server/src/
├── config/         # Conexão com o banco (pool MySQL)
├── controllers/    # Recebem as requisições HTTP
├── services/       # Regras de negócio (ex: validar conflito de horário)
├── repositories/   # Acesso ao banco de dados
├── routes/         # Definição das rotas da API
├── middlewares/    # Autenticação e tratamento de erros
└── database/       # schema.sql e seed.sql
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
| POST | `/api/auth/registrar` | Cria um usuário | público |
| POST | `/api/auth/login` | Faz login e retorna o token | público |
| GET | `/api/salas` | Lista as salas | logado |
| POST | `/api/salas` | Cadastra uma sala | admin |
| POST | `/api/reservas` | Cria uma reserva (valida conflito) | logado |
| GET | `/api/reservas/minhas` | Lista as reservas do usuário | logado |
| PATCH | `/api/reservas/:id/cancelar` | Cancela uma reserva | dono / admin |
| GET | `/api/reservas` | Lista todas as reservas | admin |

## Status do desenvolvimento (~40%)

### Já implementado
- Cadastro e login de usuários, com senha criptografada (bcrypt) e token JWT
- Estrutura completa em camadas Controller → Service → Repository
- Listagem de salas e cadastro de salas (admin)
- Criação de reserva com a **regra central**: bloqueio de conflito de horário
- Cancelamento de reserva (com verificação de permissão)
- Listagem "minhas reservas" e "todas as reservas" (admin)
- Cliente web em React: login/cadastro, nova reserva, lista de salas e minhas reservas
- Banco de dados MySQL com script de criação e dados iniciais

### Ainda a fazer (restante ~60%)
- Tela de administração para editar/excluir salas e gerenciar usuários
- Consulta visual de disponibilidade por sala/horário (agenda/calendário)
- Edição de reserva e regras extras (limite de horário, antecedência)
- Painel do administrador com todas as reservas na interface
- Validações e mensagens de erro mais completas no cliente
- Testes automatizados
- Melhorias de layout, responsividade e acessibilidade
- Configuração de implantação (deploy)

## Documentação

A documentação completa (contexto e visão do produto, requisitos, arquitetura,
**modelo C4 completo** — Contexto, Container, Componentes — e diagrama de classes)
está na pasta [`documentacao/`](./documentacao/DOCUMENTACAO.md).
