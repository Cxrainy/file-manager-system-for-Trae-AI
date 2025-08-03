# -*- coding: utf-8 -*-
# File Management System Startup Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "    File Management System Startup" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Display service addresses
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tip: Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

try {
    # Start backend service in new window
    Write-Host "[1/2] Starting backend service..." -ForegroundColor Yellow
    $backendCmd = "cd /d `"$PWD\backend`" && python run.py"
    $backendProcess = Start-Process -FilePath "cmd" -ArgumentList "/k", $backendCmd -WindowStyle Normal -PassThru
    
    # Wait for backend to start
    Write-Host "[Wait] Waiting for backend service to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Start frontend service
    Write-Host "[2/2] Starting frontend service..." -ForegroundColor Yellow
    Write-Host ""
    npm run dev
    
} catch {
    Write-Host "Error occurred during startup: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup notification
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Frontend service stopped" -ForegroundColor Yellow
    Write-Host "Please manually close the backend window" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    
    # Try to close backend process if still running
    if ($backendProcess -and !$backendProcess.HasExited) {
        Write-Host "Attempting to close backend service..." -ForegroundColor Yellow
        try {
            $backendProcess.CloseMainWindow()
            Start-Sleep -Seconds 2
            if (!$backendProcess.HasExited) {
                $backendProcess.Kill()
            }
            Write-Host "Backend service closed" -ForegroundColor Green
        } catch {
            Write-Host "Cannot auto-close backend, please close manually" -ForegroundColor Yellow
        }
    }
}