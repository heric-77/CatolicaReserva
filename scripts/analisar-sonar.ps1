# Roda os testes com cobertura (servidor e cliente) e envia a análise ao SonarQube.
# Pré-requisitos: Docker Desktop aberto, SonarQube rodando em http://localhost:9000
# e o token salvo no arquivo sonar.env na raiz do projeto (SONAR_TOKEN=...).
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$raiz\sonar.env")) {
  throw 'Crie o arquivo sonar.env na raiz do projeto com a linha SONAR_TOKEN=<seu token>.'
}

# Os relatórios lcov saem com caminhos relativos a cada projeto e com "\" do Windows.
# O scanner roda em Linux, a partir da raiz: os caminhos precisam ficar como server/src/...
function Normalizar-Cobertura($projeto) {
  $arquivo = "$raiz\$projeto\coverage\lcov.info"
  $linhas = (Get-Content $arquivo) |
    ForEach-Object { if ($_ -like 'SF:*') { 'SF:' + $projeto + '/' + ($_.Substring(3) -replace '\\', '/') } else { $_ } }
  [IO.File]::WriteAllLines($arquivo, [string[]]$linhas) # UTF-8 sem BOM
}

foreach ($projeto in 'server', 'client') {
  Write-Host "`n== Testes com cobertura: $projeto ==" -ForegroundColor Cyan
  Push-Location "$raiz\$projeto"
  try {
    New-Item -ItemType Directory -Force coverage | Out-Null
    npm run test:coverage
    if ($LASTEXITCODE -ne 0) { throw "Os testes do $projeto falharam." }
  } finally {
    Pop-Location
  }
  Normalizar-Cobertura $projeto
}

Write-Host "`n== Análise do SonarQube ==" -ForegroundColor Cyan
docker run --rm `
  --env-file "$raiz\sonar.env" `
  -e SONAR_HOST_URL=http://host.docker.internal:9000 `
  -v "${raiz}:/usr/src" `
  sonarsource/sonar-scanner-cli
if ($LASTEXITCODE -ne 0) { throw 'A análise do SonarQube falhou.' }

Write-Host "`nPronto: http://localhost:9000/dashboard?id=catolicareserva" -ForegroundColor Green
