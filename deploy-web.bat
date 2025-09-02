@echo off
chcp 65001 >nul

echo.
echo ==============================================
echo   Checklist By Isaque - Deploy Web
echo ==============================================
echo.

REM Gerar build web
echo 1) Gerando build para web...
call npm run build
if errorlevel 1 (
  echo ERRO: Falha na geração do build
  goto :error
)

echo.
echo 2) Iniciando servidor local...
echo.
echo ✅ Acesse o aplicativo em: http://localhost:3000
echo.
echo 📱 Para usar offline:
echo    1. Abra http://localhost:3000 no Chrome/Edge
echo    2. Clique nos 3 pontos (menu)
echo    3. Selecione "Instalar Checklist By Isaque"
echo    4. O app ficará disponível como programa instalado
echo.
echo ⚠️  Mantenha esta janela aberta enquanto usar o aplicativo
echo.

REM Usar npx serve para servir a pasta dist
npx serve -s dist -p 3000

goto :end

:error
echo.
echo Erro durante o processo.
pause
exit /b 1

:end
echo.
echo Servidor finalizado.
pause