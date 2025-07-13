@echo off
REM Test GetAllWellBeingDataCmd
curl.exe -X POST http://localhost:5000/command/getAll -H "Content-Type: application/json" --data-binary "@getAllWellBeingDataCmd.json"
