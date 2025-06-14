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

        public async Task SetWellBeingDataAsync(SetWellBeingDataCmd command)
        {
            _logger.LogInformation("Saving data for command: {command}", command);
            await _repository.AddAsync(command.Data);
        }

        public async Task<IEnumerable<WellBeingData>> GetAllWellBeingDataAsync(GetAllWellBeingDataCmd command)
        {
            _logger.LogInformation("Retrieving all data for command {command}", command);
            return await _repository.GetAllAsync(command.StartDate, command.EndDate, command.DataTypes);
        }

        // --- Observation Type/Value Management ---
        public async Task CreateWellBeingTypeAsync(CreateWellBeingTypeCmd command)
        {
            await _repository.CreateWellBeingTypeAsync(command.Category, command.Type, command.AllowMultipleSelection);
        }

        public async Task DeleteWellBeingTypeAsync(DeleteWellBeingTypeCmd command)
        {
            await _repository.DeleteWellBeingTypeAsync(command.Category, command.Type);
        }

        public async Task AddWellBeingValueAsync(AddWellBeingValueCmd command)
        {
            await _repository.AddWellBeingValueAsync(command.Type, command.Value, command.Notable);
        }

        public async Task DeleteWellBeingValueAsync(DeleteWellBeingValueCmd command)
        {
            await _repository.DeleteWellBeingValueAsync(command.Type, command.Value);
        }

        public async Task<WellBeingValuesDefinition> GetWellBeingValuesAsync(GetWellBeingValuesCmd command)
        {
            return await _repository.GetWellBeingValuesAsync(command.Type);
        }

        public async Task<List<WellBeingDefinition>> GetWellBeingDefinitionAsync(GetWellBeingDefinitionsCmd command)
        {
            return await _repository.GetWellBeingDefinitionAsync(command.Category);
        }
    }
}

