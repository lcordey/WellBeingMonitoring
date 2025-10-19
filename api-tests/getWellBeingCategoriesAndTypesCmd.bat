@echo off
REM Test GET catalogue for well-being categories and types
curl.exe -X GET http://localhost:5000/command/catalogue -H "Accept: application/json"
