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

// Register GenericPostgresRepository for DI
builder.Services.AddSingleton<IGenericPostgresRepository>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("WellBeingDatabase");
    return new GenericPostgresRepository(connectionString);
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// Enable CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173")
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
app.MapPost("/command", async ([FromBody] SetWellBeingDataCmd command, IRestApiCommandHandler handler) =>
{
    await handler.SetWellBeingDataAsync(command);
    return Results.Ok();
}).WithName("PostSetDataCommand");

// POST /command/get-all endpoint for getting all filtered data
app.MapPost("/command/get-all", async ([FromBody] GetAllWellBeingDataCmd command, IRestApiCommandHandler handler) =>
{
    var result = await handler.GetAllWellBeingDataAsync(command);
    return Results.Ok(result);
}).WithName("PostGetAllDataCommand");

// POST /command/create-type endpoint
app.MapPost("/command/create-type", async ([FromBody] CreateWellBeingTypeCmd command, IRestApiCommandHandler handler) =>
{
    await handler.CreateWellBeingTypeAsync(command);
    return Results.Ok();
}).WithName("PostCreateWellBeingTypeCommand");

// POST /command/delete-type endpoint
app.MapPost("/command/delete-type", async ([FromBody] DeleteWellBeingTypeCmd command, IRestApiCommandHandler handler) =>
{
    await handler.DeleteWellBeingTypeAsync(command);
    return Results.Ok();
}).WithName("PostDeleteWellBeingTypeCommand");

// POST /command/add-value endpoint
app.MapPost("/command/add-value", async ([FromBody] AddWellBeingValueCmd command, IRestApiCommandHandler handler) =>
{
    await handler.AddWellBeingValueAsync(command);
    return Results.Ok();
}).WithName("PostAddWellBeingValueCommand");

// POST /command/delete-value endpoint
app.MapPost("/command/delete-value", async ([FromBody] DeleteWellBeingValueCmd command, IRestApiCommandHandler handler) =>
{
    await handler.DeleteWellBeingValueAsync(command);
    return Results.Ok();
}).WithName("PostDeleteWellBeingValueCommand");

// POST /command/get-definitions endpoint
app.MapPost("/command/get-definitions", async ([FromBody] GetWellBeingDefinitionsCmd command, IRestApiCommandHandler handler) =>
{
    var result = await handler.GetWellBeingDefinitionAsync(command);
    return Results.Ok(result);
}).WithName("PostGetWellBeingDefinitionsCommand");

// POST /command/get-values endpoint
app.MapPost("/command/get-values", async ([FromBody] GetWellBeingValuesCmd command, IRestApiCommandHandler handler) =>
{
    var result = await handler.GetWellBeingValuesAsync(command);
    return Results.Ok(result);
}).WithName("PostGetWellBeingValuesCommand");

app.Run();
