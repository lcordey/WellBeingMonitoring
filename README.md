# WellBeingMonitoring Backend

This project is an ASP.NET Core Web API backend for monitoring day-to-day well-being factors (alcohol, sleep, allergies, sun exposure, food, etc.).

## Stack
- C# ASP.NET Core Web API
- SQL Database (configurable)

## Getting Started
- Build: `dotnet build`
- Run: `dotnet run`

## Project Goals
- Clear, reviewable interfaces
- Incremental development (class-by-class, interface-by-interface)

## Next Steps
- Define initial interfaces for the backend API
- Set up database context and models incrementally

curl.exe -X POST http://localhost:5000/command -H "Content-Type: application/json" --data-binary "@setCmd.json"
curl.exe -X POST http://localhost:5000/command -H "Content-Type: application/json" --data-binary "@getCmd.json"
