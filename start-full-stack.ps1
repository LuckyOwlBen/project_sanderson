#!/usr/bin/env pwsh

# Start both backend server and frontend UI

Write-Host "Starting Sanderson RPG Full Stack..." -ForegroundColor Cyan
Write-Host ""
Write-Host "[Backend] Starting server on http://localhost:3000" -ForegroundColor Green
Write-Host "[Frontend] Starting UI on http://localhost:4200" -ForegroundColor Green
Write-Host ""

# Start backend in a separate process
$backendProcess = Start-Process -FilePath "cmd" -ArgumentList '/k', "cd server && npm start" -PassThru -WindowStyle Normal
Write-Host "[✓] Backend process started (PID: $($backendProcess.Id))" -ForegroundColor Green

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start frontend in a separate process
$frontendProcess = Start-Process -FilePath "cmd" -ArgumentList '/k', "ng serve" -PassThru -WindowStyle Normal
Write-Host "[✓] Frontend process started (PID: $($frontendProcess.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Full Stack is Running!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3000/api" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:4200" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop: Close the terminal windows or press Ctrl+C" -ForegroundColor Gray
Write-Host "Both processes will run independently." -ForegroundColor Gray
