@echo off
REM Test GetWellBeingDefinitionsCmd
curl.exe -X POST http://localhost:5000/command/getWBDefinitions -H "Content-Type: application/json" --data-binary "@getWellBeingDefinitionsCmd.json"
