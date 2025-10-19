@echo off
REM Runs the ASP.NET Core WebApi backend
dotnet run --project WebApi/WellBeingMonitoring.csproj --urls "http://0.0.0.0:5000"
