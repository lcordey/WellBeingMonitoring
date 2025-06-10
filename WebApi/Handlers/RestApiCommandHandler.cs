using RestApiInterface.Data;
using RestApiInterface.Commands;
using WebApi.DataBase;

namespace WebApi.Handlers
{
    public class RestApiCommandHandler : IRestApiCommandHandler
    {
        private readonly ILogger<RestApiCommandHandler> _logger;
        private readonly IWellBeingDataRepository _repository;

        public RestApiCommandHandler(ILogger<RestApiCommandHandler> logger, IWellBeingDataRepository repository)
        {
            _logger = logger;
            _repository = repository;
        }

        public async Task SetDataAsync(SetDataCmd command)
        {
            _logger.LogInformation("Saving data for command: {command}", command);
            await _repository.AddAsync(command.Data);
        }

        public async Task<WellBeingData?> GetDataAsync(GetDataCmd command)
        {
            _logger.LogInformation("Retrieving data for command {command}", command);
            if (command.ObservationType is ObservationType observationtype)
                return await _repository.GetAsync(command.Date, observationtype);
            if (command.SymptomType is SymptomType symptomType)
                return await _repository.GetAsync(command.Date, symptomType);

            return null;
        }

        public async Task<IEnumerable<WellBeingData>> GetAllDataAsync(GetAllDataCmd command)
        {
            _logger.LogInformation("Retrieving all data for command {command}", command);
            return await _repository.GetAllAsync(command.StartDate, command.EndDate, command.ObservationType, command.SymptomType);
        }
    }
}

