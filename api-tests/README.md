# API Test Runner

The `run-tests.js` script bootstraps the ASP.NET Core Web API with the in-memory database and performs a sequence of REST calls that exercise all implemented commands. It highlights which calls succeed and flags the ones that need attention.

## Prerequisites
- Node.js 18+ (for native `fetch` support)
- .NET 8 SDK (to run the WebApi project)

## Usage
```bash
node run-tests.js
```

Optional environment variables:
- `API_BASE_URL` – base URL (including protocol and port) to bind the API (default: `http://localhost:5290`).
- `API_PROJECT_PATH` – relative path to the ASP.NET Core project (default: `WebApi`).

The script automatically enables the in-memory database by setting the `UseInMemoryDatabase` configuration key for the launched process.
