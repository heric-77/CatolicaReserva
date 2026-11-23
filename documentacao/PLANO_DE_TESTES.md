# Plano de Testes — CatólicaReserva

**Integrantes:** Gustavo Schmitt e Heric Moreira Ribeiro

## 1. Objetivo e estratégia

Garantir que as principais regras de negócio do sistema de reservas funcionem e continuem
funcionando a cada mudança. Os testes foram divididos em dois níveis:

| Nível | O que valida | Ferramenta | Onde |
|---|---|---|---|
| **Unitário** | Uma regra de negócio ou classe isolada, sem banco (repositórios em memória) | `node:test` (Node.js) / Vitest (React) | `server/test`, `client/test` |
| **Integração** | Repositórios MySQL + `schema.sql` + regras, gravando e lendo de um **MySQL real** | `node:test` + MySQL 8 | `server/test/integracao` |

A arquitetura em camadas (SOLID) é o que permite isso: os services recebem os repositórios por
injeção de dependência, então nos testes unitários eles recebem implementações em memória e, no
teste de integração, as implementações MySQL de verdade.

## 2. Testes unitários planejados (regras de negócio)

| ID | Regra de negócio | Cenário | Resultado esperado | Arquivo |
|---|---|---|---|---|
| TU-01 | **RF06 — sem conflito de horário** | Criar reserva das 10:30–11:30 numa sala já reservada das 10:00–11:00 | Recusada com `ConflitoError` (HTTP 409) | `ReservaService.test.js` |
| TU-02 | RF06 — limite do intervalo | Criar reserva das 11:00–12:00 logo após uma das 10:00–11:00 | Aceita (encostar não é sobrepor) | `ReservaService.test.js` |
| TU-03 | Hora de fim maior que a de início | Reserva das 11:00 às 10:00 | Recusada com `DadosInvalidosError` (400) | `RegrasDeReserva.test.js` |
| TU-04 | Horário de funcionamento (07:00–22:00) | Início às 06:59 / fim às 22:30; e reserva exatamente 07:00–22:00 | Recusadas / aceita | `RegrasDeReserva.test.js` |
| TU-05 | Duração máxima de 4 horas | 08:00–12:01; e 08:00–12:00 | Recusada / aceita | `RegrasDeReserva.test.js` |
| TU-06 | Sem horário no passado | Reserva que começa no momento atual ou no dia anterior | Recusada | `RegrasDeReserva.test.js` |
| TU-07 | Antecedência máxima de 30 dias | Reserva para daqui a 31 dias; e para daqui a 30 | Recusada / aceita | `RegrasDeReserva.test.js` |
| TU-08 | Sala precisa existir | Reservar a sala de id 99 (inexistente) | Recusada com `NaoEncontradoError` (404) | `ReservaService.test.js` |
| TU-09 | Só o dono ou o administrador altera a reserva | Outro aluno tenta cancelar/editar; admin cancela | Recusado com `AcessoNegadoError` (403) / aceito | `ReservaService.test.js` |
| TU-10 | Reserva cancelada não pode ser editada | Editar uma reserva com status `CANCELADA` | Recusada com `ConflitoError` | `ReservaService.test.js` |
| TU-11 | Cadastro público não cria administrador | Registrar usuário com tipo `ADMIN` | Recusado com `DadosInvalidosError` | `UsuarioService.test.js`, `Entidades.test.js` |
| TU-12 | E-mail único e login seguro | Registrar e-mail repetido; login com senha errada | Recusado (409); mesma mensagem para e-mail ou senha errados (401) | `UsuarioService.test.js` |
| TU-13 | Admin não altera nem exclui a si mesmo | Admin muda o próprio tipo / se exclui | Recusado com `AcessoNegadoError` | `GestaoDeUsuariosService.test.js` |

Também há testes unitários da camada HTTP (rotas, autenticação por token, permissões, CORS e
status HTTP), da infraestrutura (bcrypt, JWT, SQL gerado pelos repositórios) e do cliente React
(validações, chamadas à API e todas as telas).

## 3. Teste de integração planejado (persistência no banco)

**Arquivo:** `server/test/integracao/Persistencia.integracao.js`

Antes dos testes, o banco `catolicareserva_teste` é apagado e recriado com o **mesmo
`schema.sql`** da aplicação. Cada teste começa com as tabelas limpas e os mesmos dados iniciais
(2 usuários e 1 sala), então um teste não interfere no outro.

| ID | Cenário | Resultado esperado no banco |
|---|---|---|
| TI-01 | Criar uma reserva pelo `ReservaService` e buscá-la de volta | Mesma data (sem mudar de dia pelo fuso), horas em `HH:MM:SS`, status `ATIVA` e nomes da sala e do usuário vindos do `JOIN` |
| TI-02 | **RF06 com o banco real**: criar reserva sobreposta | Recusada; continua 1 linha em `reservas`. Reserva que só encosta é gravada |
| TI-03 | Cancelar uma reserva | Status `CANCELADA` gravado; o horário fica livre para outra reserva |
| TI-04 | Editar uma reserva | Novos horários gravados; a própria reserva não conta como conflito |
| TI-05 | Listar reservas do usuário e todas | Filtro por usuário correto, com os nomes do `JOIN` |
| TI-06 | Excluir uma sala | Sala e reservas dela apagadas na mesma transação |
| TI-07 | Excluir um usuário | Usuário e reservas dele apagados; as dos outros continuam |
| TI-08 | Atualizar sala e tipo de usuário | Alterações gravadas |
| TI-09 | Restrições do banco | `UNIQUE` recusa e-mail repetido; `FOREIGN KEY` recusa reserva de sala inexistente |

## 4. Como executar

```bash
# Testes unitários (não precisam de banco)
cd server && npm test
cd client && npm test

# Teste de integração (precisa de um MySQL para testes, ver abaixo)
cd server && npm run test:integracao
```

O teste de integração precisa de um MySQL separado só para testes. Por padrão ele usa
`localhost:3307`, usuário `root` e senha `teste`; para usar outro servidor, defina
`TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER` e `TEST_DB_PASSWORD`. Ele recria o banco
`catolicareserva_teste` a cada execução e nunca usa o banco `catolicareserva` do desenvolvimento.

## 5. Resultado da execução

| Conjunto | Testes | Resultado |
|---|---|---|
| Unitários — servidor | 128 | ✅ todos passando |
| Unitários — cliente | 163 | ✅ todos passando |
| Integração — MySQL | 9 | ✅ todos passando |
| Cobertura (`npm run test:coverage`) | — | 100% das linhas e ramos, no servidor e no cliente |
