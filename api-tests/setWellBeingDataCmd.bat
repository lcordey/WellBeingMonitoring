@echo off
REM Test SetWellBeingDataCmd
curl.exe -X POST http://localhost:5000/command/setWBType -H "Content-Type: application/json" --data-binary "@setWellBeingDataCmd.json"
