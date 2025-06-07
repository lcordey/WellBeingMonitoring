@echo off
REM Sends a POST request to the backend using setCmd.json
curl.exe -X POST http://localhost:5000/command -H "Content-Type: application/json" --data-binary "@setCmd.json"
