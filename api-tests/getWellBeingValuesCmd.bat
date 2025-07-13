@echo off
REM Test GetWellBeingValuesCmd
curl.exe -X POST http://localhost:5000/command/getWBValues -H "Content-Type: application/json" --data-binary "@getWellBeingValuesCmd.json"
