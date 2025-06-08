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
        Task RemoveAsync(DateOnly date);
        Task<Observation?> GetAsync(DateOnly date, ObservationType type);
        Task<Symptom?> GetAsync(DateOnly date, SymptomType type);
    }
}
