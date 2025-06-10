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

        public async Task<IEnumerable<WellBeingData>> GetAllAsync(
            DateOnly? startDate,
            DateOnly? endDate,
            ObservationType? observationType,
            SymptomType? symptomType)
        {
            // Retrieve all data from your data source (replace with your actual data retrieval logic)
            var allData = await GetAllDataFromDbAsync();

            var filtered = allData.Where(data =>
                (!startDate.HasValue || data.Date >= startDate.Value) &&
                (!endDate.HasValue || data.Date <= endDate.Value) &&
                (observationType == null || (data is Observation o && o.ObservationType == observationType)) &&
                (symptomType == null || (data is Symptom s && s.SymptomType == symptomType))
            );

            return filtered.ToList();
        }

        private async Task<IEnumerable<WellBeingData>> GetAllDataFromDbAsync()
        {
            var allData = new List<WellBeingData>();

            // Get all observations
            var observations = await _genericRepo.GetAllAsync("Observations");
            foreach (var row in observations)
            {
                if (row is object[] arr && arr.Length > 0)
                {
                    var json = arr[^1]?.ToString(); // Assume last column is Data
                    if (!string.IsNullOrEmpty(json))
                    {
                        var obs = JsonSerializer.Deserialize<Observation>(json);
                        if (obs != null)
                            allData.Add(obs);
                    }
                }
            }

            // Get all symptoms
            var symptoms = await _genericRepo.GetAllAsync("Symptoms");
            foreach (var row in symptoms)
            {
                if (row is object[] arr && arr.Length > 0)
                {
                    var json = arr[^1]?.ToString(); // Assume last column is Data
                    if (!string.IsNullOrEmpty(json))
                    {
                        var sym = JsonSerializer.Deserialize<Symptom>(json);
                        if (sym != null)
                            allData.Add(sym);
                    }
                }
            }

            return allData;
        }
    }
}
