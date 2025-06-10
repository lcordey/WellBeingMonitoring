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
app.MapPost("/command", async ([FromBody] SetDataCmd command, IRestApiCommandHandler handler) =>
{
    await handler.SetDataAsync(command);
    return Results.Ok();
}).WithName("PostSetDataCommand");

// GET /command endpoint for getting data by date
app.MapGet("/command", async ([FromBody] GetDataCmd command, IRestApiCommandHandler handler) =>
{
    var result = await handler.GetDataAsync(command);
    return result is not null ? Results.Ok(result) : Results.NotFound();
}).WithName("GetDataCommand");

// POST /command/get endpoint for getting data by date
app.MapPost("/command/get", async ([FromBody] GetDataCmd command, IRestApiCommandHandler handler) =>
{
    var result = await handler.GetDataAsync(command);
    return result is not null ? Results.Ok(result) : Results.NotFound();
}).WithName("PostGetDataCommand");

// POST /command/get-all endpoint for getting all filtered data
app.MapPost("/command/get-all", async ([FromBody] GetAllDataCmd command, IRestApiCommandHandler handler) =>
{
    var result = await handler.GetAllDataAsync(command);
    return Results.Ok(result);
}).WithName("PostGetAllDataCommand");

app.Run();
