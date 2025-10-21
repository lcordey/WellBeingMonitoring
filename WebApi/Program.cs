using Microsoft.AspNetCore.Mvc;
using RestApiInterface.Commands;
using WebApi.Handlers;
using WebApi.DataBase;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register the command handler for DI
builder.Services.AddSingleton<IRestApiCommandHandler, RestApiCommandHandler>();

// Register WellBeingDataRepository for DI
builder.Services.AddSingleton<IWellBeingDataRepository, WellBeingDataRepository>();

// Register a database repository for DI
var useInMemoryDatabase = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");
if (useInMemoryDatabase)
{
    builder.Services.AddSingleton<IGenericPostgresRepository, InMemoryGenericRepository>();
}
else
{
    builder.Services.AddSingleton<IGenericPostgresRepository>(sp =>
    {
        var configuration = sp.GetRequiredService<IConfiguration>();
        var logger = sp.GetRequiredService<ILogger<GenericPostgresRepository>>();
        var connectionString = configuration.GetConnectionString("WellBeingDatabase");
        return new GenericPostgresRepository(connectionString, logger);
    });
}

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// Enable CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173", "http://192.168.178.22:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS policy
app.UseCors("AllowFrontend");

// POST /command endpoint for setting data
app.MapPost("/command/addWBData", async ([FromBody] AddWellBeingDataCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received SetWellBeingDataCmd: {@Command}", command);
    await handler.AddWellBeingDataAsync(command);
    return Results.Ok();
}).WithName("PostSetDataCommand");

app.MapPost("/command/deleteWBData", async ([FromBody] DeleteWellBeingDataCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received DeleteWellBeingDataCmd: {@Command}", command);
    await handler.DeleteWellBeingDataAsync(command);
    return Results.Ok();
}).WithName("PostDeleteDataCommand");

// POST /command/get-all endpoint for getting all filtered data
app.MapPost("/command/getAll", async ([FromBody] GetAllWellBeingDataCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received GetAllWellBeingDataCmd: {@Command}", command);
    var result = await handler.GetAllWellBeingDataAsync(command);
    return Results.Ok(result);
}).WithName("PostGetAllDataCommand");

// POST /command/create-type endpoint
app.MapPost("/command/createWBType", async ([FromBody] CreateWellBeingTypeCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received CreateWellBeingTypeCmd: {@Command}", command);
    await handler.CreateWellBeingTypeAsync(command);
    return Results.Ok();
}).WithName("PostCreateWellBeingTypeCommand");

// POST /command/delete-type endpoint
app.MapPost("/command/deleteWBType", async ([FromBody] DeleteWellBeingTypeCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received DeleteWellBeingTypeCmd: {@Command}", command);
    await handler.DeleteWellBeingTypeAsync(command);
    return Results.Ok();
}).WithName("PostDeleteWellBeingTypeCommand");

// POST /command/add-value endpoint
app.MapPost("/command/addWBValue", async ([FromBody] AddWellBeingValueCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received AddWellBeingValueCmd: {@Command}", command);
    await handler.AddWellBeingValueAsync(command);
    return Results.Ok();
}).WithName("PostAddWellBeingValueCommand");

// POST /command/delete-value endpoint
app.MapPost("/command/deleteWBValue", async ([FromBody] DeleteWellBeingValueCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received DeleteWellBeingValueCmd: {@Command}", command);
    await handler.DeleteWellBeingValueAsync(command);
    return Results.Ok();
}).WithName("PostDeleteWellBeingValueCommand");

// POST /command/get-definitions endpoint
app.MapPost("/command/getWBDefinitions", async ([FromBody] GetWellBeingDefinitionsCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received GetWellBeingDefinitionsCmd: {@Command}", command);
    var result = await handler.GetWellBeingDefinitionAsync(command);
    return Results.Ok(result);
}).WithName("PostGetWellBeingDefinitionsCommand");

// POST /command/get-values endpoint
app.MapPost("/command/getWBValues", async ([FromBody] GetWellBeingValuesCmd command, IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received GetWellBeingValuesCmd: {@Command}", command);
    var result = await handler.GetWellBeingValuesAsync(command);
    logger.LogInformation("GetWellBeingValuesCmd completed: {Result}", result);
    return result;
}).WithName("PostGetWellBeingValuesCommand");

// GET /command/catalogue endpoint for categories and types
app.MapGet("/command/catalogue", async (IRestApiCommandHandler handler, ILogger<Program> logger) =>
{
    logger.LogInformation("Received request for categories and types catalogue");
    var result = await handler.GetWellBeingCategoriesAndTypesAsync();
    return Results.Ok(result);
}).WithName("GetWellBeingCategoriesAndTypes");

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Application started at {Time}", DateTime.UtcNow);
logger.LogInformation("Environment: {EnvironmentName}", app.Environment.EnvironmentName);
logger.LogInformation("Using {DatabaseType} as database repository", useInMemoryDatabase ? "InMemory" : "PostgreSQL");

app.Run();
