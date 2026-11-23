# Qualidade de código com SonarQube — CatólicaReserva

**Integrantes:** Gustavo Schmitt e Heric Moreira Ribeiro

Este documento registra como a análise do SonarQube foi configurada, o que ela apontou no
projeto (servidor e cliente), o que foi corrigido e como rodar a análise de novo.

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
| Linhas duplicadas | 1,6% | 1,6% |

¹ Na primeira análise o Quality Gate só avalia "código novo", e ainda não havia nenhum.

Testes automatizados: **128 no servidor** (`node:test`) e **100 no cliente** (Vitest + Testing Library).

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
- todas as telas com a API simulada: login e cadastro, reservas, agenda, administração e `App`.

Nenhum teste precisa de banco de dados nem do servidor rodando.

## 4. Como rodar

Pré-requisitos: Docker Desktop aberto e Node.js 20 ou mais novo.

```powershell
# 1. Subir o SonarQube (só na primeira vez; depois basta "docker start sonarqube")
docker run -d --name sonarqube -p 9000:9000 -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true `
  -v sonarqube_data:/opt/sonarqube/data -v sonarqube_extensions:/opt/sonarqube/extensions `
  -v sonarqube_logs:/opt/sonarqube/logs sonarqube:community

# 2. Em http://localhost:9000: entrar (admin/admin), trocar a senha e gerar um token
#    em My Account > Security. Salvar na raiz do projeto, no arquivo sonar.env:
#    SONAR_TOKEN=<token>      (o arquivo está no .gitignore)

# 3. Rodar testes + análise
.\scripts\analisar-sonar.ps1
```

Para rodar só os testes:

```bash
cd server && npm test            # ou npm run test:coverage
cd client && npm test            # ou npm run test:coverage
```
