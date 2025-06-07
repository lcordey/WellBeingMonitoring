@echo off
REM Sends a GET request to the backend using getCmd.json as query parameters
curl.exe -X GET http://localhost:5000/command -H "Content-Type: application/json" --data-binary "@getCmd.json"
