@echo off
echo Setting up Inventory Management System...

echo.
echo === Backend Setup ===
cd backend

echo Installing PHP dependencies...
call composer install --no-dev --optimize-autoloader

echo Generating application key...
call php artisan key:generate

echo Setting up database...
echo Please make sure your database is created and configured in .env file
echo Import the inventory_base.sql file into your database

echo.
echo === Frontend Setup ===
cd ..\frontend

echo Installing Node.js dependencies...
call npm install

echo Building production assets...
call npm run build

echo.
echo === Setup Complete ===
echo.
echo Backend API: http://localhost:8000
echo Frontend App: http://localhost:3000
echo.
echo To start the servers:
echo 1. Backend: cd backend && php artisan serve
echo 2. Frontend: cd frontend && npm start
echo.
echo Default login: admin / password
echo.
pause