using RestApiInterface.Data;
using RestApiInterface.Commands;

namespace WebApi.Handlers
{
    /// <summary>
    /// Generic interface for handling REST API commands (set, get, etc.).
    /// </summary>
    public interface IRestApiCommandHandler
    {
        Task SetWellBeingDataAsync(SetWellBeingDataCmd command);
        Task<IEnumerable<WellBeingData>> GetAllWellBeingDataAsync(GetAllWellBeingDataCmd command);
        
        // Observation type/value management
        Task CreateWellBeingTypeAsync(CreateWellBeingTypeCmd command);
        Task DeleteWellBeingTypeAsync(DeleteWellBeingTypeCmd command);
        Task AddWellBeingValueAsync(AddWellBeingValueCmd command);
        Task DeleteWellBeingValueAsync(DeleteWellBeingValueCmd command);
        Task<List<WellBeingDefinition>> GetWellBeingDefinitionAsync(GetWellBeingDefinitionsCmd command);
        Task<WellBeingValuesDefinition> GetWellBeingValuesAsync(GetWellBeingValuesCmd command);
    }
}
