@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

echo.
echo ==============================================
echo   Checklist By Isaque - Build Portatil (1 clique)
echo ==============================================
echo.

REM Verificar se esta na pasta correta
if not exist "package.json" (
  echo ERRO: package.json nao encontrado!
  echo Certifique-se de que esta executando o script na pasta raiz do projeto.
  goto :error
)

REM 1) Preparar Node.js portatil (sem admin)
set "NODE_VERSION=20.16.0"
set "TOOLS_DIR=%CD%\tools"
set "NODE_BASE=%TOOLS_DIR%\node"
set "NODE_ZIP=node-v%NODE_VERSION%-win-x64.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_ZIP%"
set "NODE_EXTRACT_DIR=%NODE_BASE%\node-v%NODE_VERSION%-win-x64"

echo Criando diretorios...
if not exist "%TOOLS_DIR%" (
  mkdir "%TOOLS_DIR%"
  if errorlevel 1 (
    echo ERRO: Nao foi possivel criar pasta tools
    goto :error
  )
)
if not exist "%NODE_BASE%" (
  mkdir "%NODE_BASE%"
  if errorlevel 1 (
    echo ERRO: Nao foi possivel criar pasta node
    goto :error
  )
)

if not exist "%NODE_EXTRACT_DIR%\node.exe" (
  echo Testando conexao com internet...
  ping -n 1 nodejs.org >nul 2>&1
  if errorlevel 1 (
    echo ERRO: Sem conexao com internet. Verifique sua conexao.
    goto :error
  )
  
  echo Baixando Node.js portatil %NODE_VERSION%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Write-Host 'Iniciando download...'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_BASE%\%NODE_ZIP%' -UseBasicParsing; Write-Host 'Download concluido!' } catch { Write-Error 'Erro no download: '; Write-Error $_; exit 1 }"
  if errorlevel 1 (
    echo ERRO: Falha no download do Node.js
    goto :error
  )

  echo Extraindo Node.js...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -Path '%NODE_BASE%\%NODE_ZIP%' -DestinationPath '%NODE_BASE%' -Force; Write-Host 'Extracao concluida!' } catch { Write-Error 'Erro na extracao: '; Write-Error $_; exit 1 }"
  if errorlevel 1 (
    echo ERRO: Falha na extracao do Node.js
    goto :error
  )
  
  echo Limpando arquivo ZIP...
  del "%NODE_BASE%\%NODE_ZIP%" >nul 2>&1
) else (
  echo Node.js portatil ja encontrado. Pulando download.
)

set "PATH=%NODE_EXTRACT_DIR%;%PATH%"

REM Mostrar versoes
for /f %%v in ('node -v 2^>nul') do set "NODEV=%%v"
for /f %%v in ('npm -v 2^>nul') do set "NPMV=%%v"
echo Node: %NODEV%  | findstr /r "." >nul || (echo ERRO: Node nao encontrado. && goto :error)
echo NPM:  %NPMV%

echo.
echo 2) Verificando e instalando dependencias...
echo    (Isso pode levar alguns minutos na primeira vez)
if exist "node_modules" (
  echo Dependencias ja instaladas. Verificando...
  call npm ci --only=production --silent
) else (
  echo Instalando dependencias pela primeira vez...
  call npm install --silent
)
if errorlevel 1 (
  echo ERRO: Falha na instalacao das dependencias
  echo Tentando novamente com cache limpo...
  call npm cache clean --force
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo 3) Gerando build do frontend (Vite)...
call npm run build
if errorlevel 1 (
  echo ERRO: Falha na geracao do build
  echo Verifique se todos os arquivos estao corretos
  goto :error
)

echo.
echo 4) Empacotando aplicativo portatil (electron-builder)...
echo    Gerando executavel portatil...
call npx electron-builder --win portable --config electron-builder.json
if errorlevel 1 (
  echo ERRO: Falha no empacotamento
  echo Tentando novamente...
  call npx electron-builder --win portable --config electron-builder.json
  if errorlevel 1 goto :error
)

echo.
echo Sucesso! O executavel portatil foi gerado em: dist-electron
set "DIST_DIR=%CD%\dist-electron"
echo.
echo Abrindo pasta com o executavel...
if exist "%DIST_DIR%" (
  echo Caminho: "%DIST_DIR%"
  rem Tenta abrir diretamente a pasta (metodo mais confiavel)
  start "" "%DIST_DIR%"
  rem Fallback caso o comando acima falhe
  if errorlevel 1 (
    explorer "%DIST_DIR%"
  )
) else (
  echo ATENCAO: Pasta nao encontrada: "%DIST_DIR%"
  echo Verifique se a build terminou sem erros.
)

echo.
echo Observacao: Se o SmartScreen aparecer, clique em "Mais informacoes" > "Executar assim mesmo".

echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo   ERRO DURANTE O PROCESSO
echo ========================================
echo.
echo Possiveis solucoes:
echo 1. Verifique sua conexao com internet
echo 2. Execute como Administrador (clique direito > Executar como administrador)
echo 3. Desative temporariamente o antivirus
echo 4. Certifique-se de ter espaco livre no disco (minimo 2GB)
echo 5. Verifique se o Windows Defender nao esta bloqueando
echo.
echo Se o problema persistir, entre em contato com o suporte.
echo.
pause
exit /b 1
