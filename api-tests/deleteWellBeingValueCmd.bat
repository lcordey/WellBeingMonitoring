@echo off
REM Test DeleteWellBeingValueCmd
curl.exe -X POST http://localhost:5000/command/deleteWBValue -H "Content-Type: application/json" --data-binary "@deleteWellBeingValueCmd.json"
