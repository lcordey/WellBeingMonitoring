using RestApiInterface.Data;
using System.Text.Json;

namespace WebApi.DataBase
{
    /// <summary>
    /// High-level repository for WellBeingData, using IGenericPostgresRepository for data access.
    /// </summary>
    public class WellBeingDataRepository : IWellBeingDataRepository
    {
        private readonly IGenericPostgresRepository _genericRepo;

        public WellBeingDataRepository(IGenericPostgresRepository genericRepo)
        {
            _genericRepo = genericRepo;
        }

        public async Task AddAsync(WellBeingData data)
        {
            var (type, table) = data switch
            {
                Observation observation => (observation.ObservationType.ToString(), "Observations"),
                Symptom symptom => (symptom.SymptomType.ToString(), "Symptoms"),
                _ => throw new ArgumentException("Unsupported WellBeingData type")
            };
            var dict = new Dictionary<string, object>
            {
                ["Date"] = data.Date,
                ["Type"] = type,
                ["Data"] = JsonSerializer.Serialize(data)
            };
            var filter = new Dictionary<string, object>
            {
                ["Date"] = data.Date,
                ["Type"] = type
            };
            var existing = await _genericRepo.GetAsync(table, filter);
            if (existing.Count > 0)
                await _genericRepo.UpdateAsync(table, dict, filter);
            else
                await _genericRepo.AddAsync(table, dict);
        }

        public async Task RemoveAsync(DateOnly date)
        {
            var filter = new Dictionary<string, object> { ["Date"] = date };
            await _genericRepo.RemoveAsync("WellBeingDataTable", filter);
        }

        public async Task<Observation?> GetAsync(DateOnly date, ObservationType type)
        {
            var filter = new Dictionary<string, object>
            {
                ["Date"] = date,
                ["Type"] = type.ToString()
            };
            var results = await _genericRepo.GetAsync("Observations", filter);
            if (results.Count > 0 && results[0] is object[] row && row.Length > 0)
            {
                var json = row[^1]?.ToString(); // Assume last column is Data
                return json != null ? JsonSerializer.Deserialize<Observation>(json) : null;
            }
            return null;
        }

        public async Task<Symptom?> GetAsync(DateOnly date, SymptomType type)
        {
            var filter = new Dictionary<string, object>
            {
                ["Date"] = date,
                ["Type"] = type.ToString()
            };
            var results = await _genericRepo.GetAsync("Symptoms", filter);
            if (results.Count > 0 && results[0] is object[] row && row.Length > 0)
            {
                var json = row[^1]?.ToString(); // Assume last column is Data
                return json != null ? JsonSerializer.Deserialize<Symptom>(json) : null;
            }
            return null;
        }
    }
}
