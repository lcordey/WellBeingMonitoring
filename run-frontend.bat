@echo off
REM Runs the js frontend
cd /d %~dp0\web-frontend
npm run dev -- --host 0.0.0.0