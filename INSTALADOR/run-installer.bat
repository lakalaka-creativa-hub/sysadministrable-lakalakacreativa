echo Iniciando instalador...
@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  npm install
  if errorlevel 1 (
    echo Error instalando dependencias.
    pause
    exit /b 1
  )
)
echo Iniciando instalador...
npm start
if errorlevel 1 (
  echo Error al iniciar el instalador.
)
pause
