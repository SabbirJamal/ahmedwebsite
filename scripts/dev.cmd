@echo off
cd /d "%~dp0.."
npm run dev > dev-server.log 2>&1
