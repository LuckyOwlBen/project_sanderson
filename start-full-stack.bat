@echo off
REM Start both backend server and frontend UI in separate windows

echo Starting Sanderson RPG Full Stack...
echo.
echo [Backend] Starting server on http://localhost:3000
start "Sanderson Backend" cmd /k "cd server && npm start"

timeout /t 3 /nobreak

echo [Frontend] Starting UI on http://localhost:4200
start "Sanderson UI" cmd /k "ng serve"

echo.
echo Both processes started! 
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:4200
echo.
echo Press Ctrl+C in either window to stop that service.
echo Close both windows when done developing.
