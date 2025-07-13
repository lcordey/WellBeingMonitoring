@echo off
REM Test AddWellBeingValueCmd
curl.exe -X POST http://localhost:5000/command/addWBValue -H "Content-Type: application/json" --data-binary "@addWellBeingValueCmd.json"
