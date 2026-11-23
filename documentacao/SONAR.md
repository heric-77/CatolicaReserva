# Qualidade de código com Sonar — CatólicaReserva

**Integrantes:** Gustavo Schmitt e Heric Moreira Ribeiro

Este documento registra o que a análise do SonarQube apontou no projeto (servidor e cliente),
o que foi corrigido e como verificar o código hoje com o SonarLint na IDE.

A análise foi feita com um servidor SonarQube local, que depois foi desativado. A verificação
contínua passou a ser feita pelo SonarLint (SonarQube for IDE), que usa as mesmas regras.

## 1. Resultado

| Métrica | Primeira análise | Depois das correções |
|---|---|---|
| Quality Gate | Aprovado¹ | **Aprovado** |
| Bugs | 17 | **0** |
| Vulnerabilidades | 1 | **0** |
| Code smells | 8 | **0** |
| Security hotspots | 0 | **0** |
| Confiabilidade / Segurança / Manutenibilidade | C / C / A | **A / A / A** |
| Cobertura de testes | 99,7% | **100%** (linhas e ramos) |
| Linhas duplicadas | 1,6% | **0%**² |

¹ Na primeira análise o Quality Gate só avalia "código novo", e ainda não havia nenhum.
² Medido depois do novo visual, em que a lista de reservas virou um componente só (`ItemReserva`).

Testes automatizados: **128 no servidor** (`node:test`), **9 de integração** com o MySQL e
**163 no cliente** (Vitest + Testing Library).

## 2. O que o Sonar apontou e como foi corrigido

| Regra | Onde | Problema | Correção |
|---|---|---|---|
| S5122 (vulnerabilidade) | `server/src/app.js` | `cors()` liberava a API para qualquer site | A origem permitida vem de `CORS_ORIGIN` (padrão: `http://localhost:5173`), lida em `config/ambiente.js` e injetada pelo `container.js` |
| S9383 (bug) | `server/src/server.js` | `iniciar()` sem tratar a falha: um erro na subida sumiria em silêncio | `iniciar().catch(...)` registra o erro e encerra com código 1 |
| S9383 (bug) ×13 | telas do cliente | `carregar()` chamada sem `await` | `await carregar()` nas funções `async`; `void carregar()` nos `useEffect` |
| S9011 (bug) ×3 | `FormularioReserva`, `Login`, `AdminSalas` | Botão de envio sem `type` | `type="submit"` explícito |
| S9379 | `FormularioReserva.jsx` | `autoFocus` | Foco feito por `ref` + `useEffect` só quando o formulário de edição abre |
| S6845 | `Agenda.jsx` | `tabIndex` em `div` não interativa | Removido: os navegadores já deixam focar áreas roláveis |
| S2699 ×6 | testes do servidor | Testes de "aceita" sem nenhuma asserção | `assert.doesNotReject(...)` / `assert.equal(...)` explícitos |

Além do Sonar, o `npm audit` apontava vulnerabilidades nas dependências. Elas foram corrigidas
atualizando o `body-parser`/`qs` do servidor e as ferramentas do cliente (Vite 5 → 8, Vitest 5).

## 3. O que os testes cobrem

**Servidor** (`server/test`):
- regras de negócio, entidades e services, com repositórios em memória (`test/fakes/emMemoria.js`);
- contratos: todas as implementações, reais e falsas, cumprem as interfaces;
- camada HTTP de ponta a ponta (`test/http/Api.test.js`): rotas, autenticação, permissões,
  CORS, status HTTP e formato do JSON;
- repositórios MySQL com um pool falso que confere o SQL (`test/fakes/poolFalso.js`),
  bcrypt, JWT, `container.js` e `config/ambiente.js`.

**Cliente** (`client/test`):
- `api.js` (token, erros, sessão expirada), validações e formatos;
- todas as telas com a API simulada: login e cadastro, início, salas, agenda, minhas reservas,
  administração e `App`;
- componentes: painel de reserva, diálogos de confirmação, avisos e formulários.

Fora o teste de integração (`npm run test:integracao`), nenhum teste precisa de banco de dados
nem do servidor rodando.

## 4. Como verificar

**Análise com o SonarLint (na IDE):**

1. Instale a extensão **SonarQube for IDE** (antigo SonarLint) no VS Code:
   `code --install-extension SonarSource.sonarlint-vscode`.
2. Abra os arquivos que quer conferir: o SonarLint analisa os arquivos abertos enquanto você edita.
3. Os alertas aparecem no painel **Problems** (`Ctrl+Shift+M`); com o código atual, ele fica vazio.

**Testes e cobertura:**

```bash
cd server && npm test            # ou npm run test:coverage
cd client && npm test            # ou npm run test:coverage
```
