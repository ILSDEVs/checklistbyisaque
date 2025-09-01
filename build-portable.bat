@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

echo.
echo ==============================================
echo   Checklist By Isaque - Build Portatil (1 clique)
echo ==============================================
echo.

REM 1) Preparar Node.js portatil (sem admin)
set "NODE_VERSION=20.16.0"
set "TOOLS_DIR=%CD%\tools"
set "NODE_BASE=%TOOLS_DIR%\node"
set "NODE_ZIP=node-v%NODE_VERSION%-win-x64.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_ZIP%"
set "NODE_EXTRACT_DIR=%NODE_BASE%\node-v%NODE_VERSION%-win-x64"

if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%" >nul 2>&1
if not exist "%NODE_BASE%" mkdir "%NODE_BASE%" >nul 2>&1

if not exist "%NODE_EXTRACT_DIR%\node.exe" (
  echo Baixando Node.js portatil %NODE_VERSION%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_BASE%\%NODE_ZIP%' -UseBasicParsing } catch { Write-Error $_; exit 1 }"
  if errorlevel 1 goto :error

  echo Extraindo Node.js...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%NODE_BASE%\%NODE_ZIP%' -DestinationPath '%NODE_BASE%' -Force"
  if errorlevel 1 goto :error
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
echo 2) Instalando dependencias (isso pode levar alguns minutos)...
call npm ci || call npm install
if errorlevel 1 goto :error

echo.
echo 3) Gerando build do frontend (Vite)...
call npm run build
if errorlevel 1 goto :error

echo.
echo 4) Empacotando aplicativo portatil (electron-builder)...
npx electron-builder --win portable
if errorlevel 1 goto :error

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
echo Ocorreu um erro durante o processo. Verifique as mensagens acima e tente novamente.
pause
exit /b 1
