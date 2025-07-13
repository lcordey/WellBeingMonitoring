@echo off
REM Test DeleteWellBeingTypeCmd
curl.exe -X POST http://localhost:5000/command/deleteWBType -H "Content-Type: application/json" --data-binary "@deleteWellBeingTypeCmd.json"
