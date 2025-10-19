@echo off
REM Runs the API tests for the backend (assumes backend is already running)
cd /d %~dp0\api-tests
node run-tests.js
