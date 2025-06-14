using RestApiInterface.Data;
using System;
using System.Threading.Tasks;

namespace WebApi.DataBase
{
    /// <summary>
    /// Interface for adding and removing WellBeingData entries in the database.
    /// </summary>
    public interface IWellBeingDataRepository
    {
        Task AddAsync(WellBeingData data);
        Task RemoveAsync(DateOnly date, string category, string type);
        Task<WellBeingData?> GetWellBeingDataAsync(DateOnly date, string category, string type);
        Task<IEnumerable<WellBeingData>> GetAllAsync(DateOnly? startDate, DateOnly? endDate, IList<(string Category, string Type)> dataTypes);

        // Observation type/value management
        Task CreateWellBeingTypeAsync(string category, string type, bool allowMultipleSelection);
        Task DeleteWellBeingTypeAsync(string category, string type);
        Task AddWellBeingValueAsync(string type, string value, bool notable);
        Task DeleteWellBeingValueAsync(string type, string value);
        Task<List<WellBeingDefinition>> GetWellBeingDefinitionAsync(string category);
        Task<WellBeingValuesDefinition> GetWellBeingValuesAsync(string type);
    }
}
