using RestApiInterface.Data;
using RestApiInterface.Commands;
using System.Collections.Generic;
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
            _logger.LogInformation("RestApiCommandHandler initialized");
        }

        public async Task AddWellBeingDataAsync(AddWellBeingDataCmd command)
        {
            _logger.LogInformation("SetWellBeingDataAsync called with command: {@Command}", command);
            await _repository.AddAsync(command.Data);
            _logger.LogInformation("SetWellBeingDataAsync completed");
        }

        public async Task<IEnumerable<WellBeingData>> GetAllWellBeingDataAsync(GetAllWellBeingDataCmd command)
        {
            _logger.LogInformation("GetAllWellBeingDataAsync called with command: {@Command}", command);
            var result = await _repository.GetAllAsync(command.StartDate, command.EndDate, command.DataTypes);
            _logger.LogInformation("GetAllWellBeingDataAsync returning {Count} records", result?.Count() ?? 0);
            return result!;
        }

        // --- Observation Type/Value Management ---
        public async Task CreateWellBeingTypeAsync(CreateWellBeingTypeCmd command)
        {
            _logger.LogInformation("CreateWellBeingTypeAsync called with command: {@Command}", command);
            await _repository.CreateWellBeingTypeAsync(command.Category, command.Type, command.AllowMultipleSelection);
            _logger.LogInformation("CreateWellBeingTypeAsync completed");
        }

        public async Task DeleteWellBeingTypeAsync(DeleteWellBeingTypeCmd command)
        {
            _logger.LogInformation("DeleteWellBeingTypeAsync called with command: {@Command}", command);
            await _repository.DeleteWellBeingTypeAsync(command.Category, command.Type);
            _logger.LogInformation("DeleteWellBeingTypeAsync completed");
        }

        public async Task AddWellBeingValueAsync(AddWellBeingValueCmd command)
        {
            _logger.LogInformation("AddWellBeingValueAsync called with command: {@Command}", command);
            await _repository.AddWellBeingValueAsync(command.Type, command.Value, command.Notable);
            _logger.LogInformation("AddWellBeingValueAsync completed");
        }

        public async Task DeleteWellBeingValueAsync(DeleteWellBeingValueCmd command)
        {
            _logger.LogInformation("DeleteWellBeingValueAsync called with command: {@Command}", command);
            await _repository.DeleteWellBeingValueAsync(command.Type, command.Value);
            _logger.LogInformation("DeleteWellBeingValueAsync completed");
        }

        public async Task<WellBeingValuesDefinition> GetWellBeingValuesAsync(GetWellBeingValuesCmd command)
        {
            _logger.LogInformation("GetWellBeingValuesAsync called with command: {@Command}", command);
            var result = await _repository.GetWellBeingValuesAsync(command.Type);
            _logger.LogInformation("GetWellBeingValuesAsync returning definition with {Count} values {Values}", result.Values.Count, result.Values);
            return result;
        }

        public async Task<List<WellBeingDefinition>> GetWellBeingDefinitionAsync(GetWellBeingDefinitionsCmd command)
        {
            _logger.LogInformation("GetWellBeingDefinitionAsync called with command: {@Command}", command);
            var result = await _repository.GetWellBeingDefinitionAsync(command.Category);
            _logger.LogInformation("GetWellBeingDefinitionAsync returning {Count} definitions", result.Count);
            return result;
        }

        public async Task<IReadOnlyList<WellBeingCategoryTypes>> GetWellBeingCategoriesAndTypesAsync()
        {
            _logger.LogInformation("GetWellBeingCategoriesAndTypesAsync called");
            var result = await _repository.GetAllCategoriesAndTypesAsync();
            _logger.LogInformation("GetWellBeingCategoriesAndTypesAsync returning {Count} categories", result.Count);
            return result;
        }
    }
}

