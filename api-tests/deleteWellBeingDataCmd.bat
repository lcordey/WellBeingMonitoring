@echo off
REM Test DeleteWellBeingDataCmd
curl.exe -X POST http://localhost:5000/command/deleteWBData -H "Content-Type: application/json" --data-binary "@deleteWellBeingDataCmd.json"
