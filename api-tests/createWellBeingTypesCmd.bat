@echo off
REM Test CreateWellBeingTypesCmd
curl.exe -X POST http://localhost:5000/command/createWbType -H "Content-Type: application/json" --data-binary "@createWellBeingTypesCmd.json"
