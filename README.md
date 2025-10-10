# WellBeingMonitoring Backend

This project is an ASP.NET Core Web API backend for monitoring day-to-day well-being factors (alcohol, sleep, allergies, sun exposure, food, etc.).

## Stack
- C# ASP.NET Core Web API
- SQL Database (configurable)

## Getting Started
- Build: `dotnet build`
- Run: `dotnet run`

### Using the in-memory database for development/tests
Set the `UseInMemoryDatabase` configuration value to `true` (for example by exporting the environment variable `UseInMemoryDatabase=true`) to replace the PostgreSQL repository with an in-memory implementation. This is especially useful for automated testing and local development when a PostgreSQL instance is not available.

### Automated API smoke tests
You can execute an end-to-end smoke test suite that boots the API with the in-memory database and exercises every REST command:

```bash
node api-tests/run-tests.js
```

The script reports which commands succeeded and highlights any failures that require attention.

## Project Goals
- Clear, reviewable interfaces
- Incremental development (class-by-class, interface-by-interface)

## Next Steps
- Define initial interfaces for the backend API
- Set up database context and models incrementally

curl.exe -X POST http://localhost:5000/command -H "Content-Type: application/json" --data-binary "@setCmd.json"
curl.exe -X POST http://localhost:5000/command -H "Content-Type: application/json" --data-binary "@getCmd.json"
