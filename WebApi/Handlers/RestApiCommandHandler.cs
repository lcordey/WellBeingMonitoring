using RestApiInterface.Data;
using RestApiInterface.Commands;

namespace WebApi.Handlers
{
    public class RestApiCommandHandler : IRestApiCommandHandler
    {
        private readonly ILogger<RestApiCommandHandler> _logger;
        private readonly List<WellBeingData> _dataStore = new(); // In-memory store for demo

        public RestApiCommandHandler(ILogger<RestApiCommandHandler> logger)
        {
            _logger = logger;
        }

        public Task SetDataAsync(SetDataCmd command)
        {
            _logger.LogInformation("{}", command);
            _logger.LogInformation("Saving data: {data} {Type} on {Date}", command.Data, command.Data.GetType().Name, GetDate(command.Data));
            _dataStore.Add(command.Data);
            return Task.CompletedTask;
        }

        public Task<WellBeingData?> GetDataAsync(GetDataCmd command)
        {
            var result = _dataStore.FirstOrDefault(d => GetDate(d) == command.Date);
            _logger.LogInformation("Retrieving data for {Date}: {Result}", command.Date, result?.GetType().Name ?? "None");
            return Task.FromResult(result);
        }

        private static DateOnly GetDate(WellBeingData data)
        {
            return data switch
            {
                Observation o => o.Date,
                Symptom s => s.Date,
                _ => default
            };
        }
    }
}
