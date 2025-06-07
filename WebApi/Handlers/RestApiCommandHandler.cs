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
            _logger.LogInformation("Saving data: {Data}", command);
            _dataStore.Add(command.Data);
            return Task.CompletedTask;
        }

        public Task<WellBeingData?> GetDataAsync(GetDataCmd command)
        {
            var result = _dataStore.FirstOrDefault(d => d.Date == command.Date);
            _logger.LogInformation("Retrieving data for {Date}: {Result}", command.Date, result?.GetType().Name ?? "None");
            return Task.FromResult(result);
        }
    }
}
