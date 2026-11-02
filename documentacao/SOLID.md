# Refatoração SOLID — CatólicaReserva (servidor)

**Integrantes:** Gustavo Schmitt e Heric Moreira Ribeiro

Este documento registra o que foi aplicado de cada princípio SOLID no servidor, como foi
aplicado e por quê, e mostra a consistência com os diagramas C4 (Container e Componentes).

A API continua com as mesmas rotas, os mesmos status HTTP e o mesmo formato de JSON:
o cliente React não precisou mudar. Isso foi conferido rodando o mesmo roteiro de 25
chamadas antes e depois da refatoração.

## 1. Nova organização

```
server/src/
├── dominio/            ← núcleo: não importa Express, MySQL, bcrypt nem JWT
│   ├── entidades/      Reserva, Sala, Usuario
│   ├── contratos/      interfaces (Contrato.js + 9 contratos)
│   ├── regras/         reserva/ e cancelamento/ — uma classe por regra
│   └── erros.js        DadosInvalidos, NaoEncontrado, Conflito, AcessoNegado, CredenciaisInvalidas
├── services/           ReservaService, SalaService, UsuarioService (casos de uso)
├── infra/              MySql*Repository, BcryptGeradorHash, JwtServicoToken
├── http/               controllers, rotas, middlewares, apresentadores (formatação do JSON)
├── container.js        Composition Root: único lugar que faz "new" das classes concretas
└── server.js           ponto de entrada
```

As dependências apontam sempre **para dentro**: `http → services → dominio ← infra`.

## 2. O que foi aplicado, como e por quê

### S — Responsabilidade Única

| Antes | Depois |
|---|---|
| `usuarioService` validava, gerava hash (bcrypt), gerava token (JWT) e montava a resposta | `UsuarioService` só coordena; hash em `BcryptGeradorHash`, token em `JwtServicoToken`, resposta em `http/apresentadores` |
| Lógica de JWT e `JWT_SECRET` duplicados no service e no middleware | Só `JwtServicoToken` conhece o JWT; o segredo é lido em `config/ambiente.js` |
| Services criavam erros com status HTTP (`erro.status = 409`) | Services lançam erros de domínio (`ConflitoError`); só o `errorHandler` traduz para HTTP |

**Por quê:** cada classe passa a ter um único motivo para mudar. Trocar o JWT não mexe
mais na regra de cadastro; mudar o formato do JSON não mexe nos services.

### O — Aberto/Fechado

| Antes | Depois |
|---|---|
| `reservaService.criar` era uma sequência de 4 `if` | Cada validação virou uma classe com `validar(reserva)` em `dominio/regras/reserva/` |
| Permissão de cancelamento fixa no service | Classe `ApenasDonoOuAdmin` em `dominio/regras/cancelamento/` |

O `ReservaService` recebe a lista de regras e só as executa em ordem:

```js
for (const regra of this.regrasDeCriacao) {
  await regra.validar(reserva);
}
```

**Por quê:** as regras previstas no README (limite de horário, antecedência) agora entram
como classes novas registradas no `container.js`, sem editar o service. O teste
`aceita regras novas sem modificar o service (OCP)` demonstra isso com uma regra de "máximo 2 horas".

### L — Substituição de Liskov

- Os testes usam repositórios **em memória** no lugar dos repositórios MySQL, e os services
  funcionam igual com os dois.
- Nenhuma implementação deixa método vazio ou lança "não implementado".
  O teste `Contratos.test.js` confere que todas as implementações, reais e falsas,
  cumprem os contratos por inteiro.
- O diagrama de classes foi corrigido: `remover(id)`, que nunca existiu, saiu, e
  `cancelar` passou a receber `(id, usuario)`.

**Por quê:** se qualquer implementação de um contrato pode substituir outra, dá para trocar
o banco ou testar sem banco sem medo de quebrar o sistema.

### I — Segregação de Interfaces

| Contrato | Métodos | Quem usa | Quem implementa |
|---|---|---|---|
| `ReservaRepository` | salvar, buscarPorId, listarPorUsuario, listarTodas, atualizarStatus | ReservaService | MySqlReservaRepository |
| `AgendaDeReservas` | buscarAtivasPorSalaEData | regra SemConflitoDeHorario | MySqlReservaRepository |
| `SalaRepository` | listar, buscarPorId, salvar | SalaService, regra SalaDeveExistir | MySqlSalaRepository |
| `UsuarioRepository` | buscarPorEmail, salvar | UsuarioService | MySqlUsuarioRepository |
| `GeradorHash` | gerar, comparar | UsuarioService | BcryptGeradorHash |
| `GeradorToken` | gerar | UsuarioService | JwtServicoToken |
| `VerificadorToken` | verificar | middleware de autenticação | JwtServicoToken |
| `RegraReserva` | validar(reserva) | ReservaService | 4 regras de criação |
| `RegraCancelamento` | validar(reserva, usuario) | ReservaService | ApenasDonoOuAdmin |

**Por quê:** cada classe depende só do que usa. A regra de conflito depende de
`AgendaDeReservas` (1 método), não do repositório inteiro. O middleware só verifica token,
e o service só gera. Métodos sem uso saíram dos contratos (ex: `usuarioRepository.buscarPorId`).

**Interfaces em JavaScript:** como a linguagem não tem `interface`, cada contrato é um objeto
`Contrato` com a lista de métodos obrigatórios. Os services chamam `Contrato.verificar(dependencia)`
no construtor: uma implementação incompleta impede o servidor de subir e mostra o que falta.

### D — Inversão de Dependência

| Antes | Depois |
|---|---|
| `const reservaRepository = require('../repositories/reservaRepository')` | `constructor({ reservaRepository, regrasDeCriacao, ... })` |
| Repositórios faziam `require('../config/db')` | Repositórios recebem o `pool` no construtor |
| Nenhum ponto central de montagem | `container.js` cria e conecta tudo; `server.js` só chama o container |

**Por quê:** services e regras dependem de contratos, não de MySQL, bcrypt ou JWT.
Isso permite testar sem banco e trocar tecnologias mudando só o `container.js`.

## 3. Bug corrigido durante a refatoração

O formulário envia horas como `"11:00"` e o banco devolve `"11:00:00"`. Na comparação de texto,
`"11:00" < "11:00:00"`, então uma reserva das 11h às 12h era recusada como conflito com outra
das 10h às 11h. A entidade `Reserva` agora padroniza as horas em `HH:MM:SS`, e há um teste
para esse caso.

## 4. Checklist da atividade

| # | Critério | Antes | Depois | Evidência |
|---|---|---|---|---|
| 1 | Componente do C4 Nível 3 ↔ módulo no código | ✅ | ✅ | Diagrama atualizado com camadas, regras, contratos e container |
| 2 | Domínio isolado da infraestrutura | ❌ | ✅ | `src/dominio` e `src/services` não importam nenhuma biblioteca externa |
| 3 | Relações do C4 = injeções no código | ⚠️ | ✅ | `container.js` reproduz as setas do diagrama |
| 4 | Responsabilidade única | ⚠️ | ✅ | Hash, token, JSON e status HTTP fora dos services |
| 5 | Sem God Classes | ✅ | ✅ | Maior arquivo: `MySqlReservaRepository` (~75 linhas) |
| 6 | Validação e persistência delegadas | ⚠️ | ✅ | `dominio/regras/*`, `infra/mysql/*` |
| 7 | Comportamento novo = classe nova | ❌ | ✅ | Lista de regras injetada; teste de OCP |
| 8 | Requisito novo não edita o núcleo | ❌ | ✅ | Mudanças ficam em regras novas e no `container.js` |
| 9 | Sem `NotImplemented` nas implementações | — | ✅ | `test/Contratos.test.js` |
| 10 | Interfaces coesas | ❌ | ✅ | 9 contratos pequenos, de 1 a 5 métodos |
| 11 | Nenhum método vazio forçado | — | ✅ | `test/Contratos.test.js` |
| 12 | Alto nível depende de abstrações | ❌ | ✅ | Services e regras recebem contratos no construtor |
| 13 | Dependências configuradas no ponto de entrada | ❌ | ✅ | `container.js`, chamado por `server.js` |

## 5. Como verificar

```bash
cd server
npm test       # 27 testes: regras, services e contratos (não precisa de banco)
npm run dev    # API em http://localhost:3001, com o mesmo comportamento de antes
```
