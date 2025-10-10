using RestApiInterface.Data;

namespace WebApi.DataBase
{
    /// <summary>
    /// High-level repository for WellBeingData, using IGenericPostgresRepository for data access.
    /// </summary>
    public class WellBeingDataRepository : IWellBeingDataRepository
    {
        private readonly IGenericPostgresRepository _genericRepo;
        private readonly ILogger<WellBeingDataRepository> _logger;

        public WellBeingDataRepository(IGenericPostgresRepository genericRepo, ILogger<WellBeingDataRepository> logger)
        {
            _genericRepo = genericRepo;
            _logger = logger;
        }

        public async Task AddAsync(WellBeingData data)
        {
            _logger.LogInformation("AddAsync called with data: {@Data}", data);
            var dict = new Dictionary<string, object>
            {
                ["date"] = data.Date,
                ["category"] = data.Category,
                ["type"] = data.Type,
                ["values_list"] = data.Values.ToArray()
            };
            await _genericRepo.AddAsync("entry_data", dict);
            _logger.LogInformation("AddAsync completed for data: {@Data}", data);
        }

        public async Task RemoveAsync(DateOnly date, string category, string type)
        {
            _logger.LogInformation("RemoveAsync called for date: {Date}, category: {Category}, type: {Type}", date, category, type);
            var filter = new Dictionary<string, object>
            {
                ["date"] = date,
                ["category"] = category,
                ["type"] = type
            };
            await _genericRepo.RemoveAsync("entry_data", filter);
            _logger.LogInformation("RemoveAsync completed for date: {Date}, category: {Category}, type: {Type}", date, category, type);
        }

        public async Task<WellBeingData?> GetWellBeingDataAsync(DateOnly date, string category, string type)
        {
            _logger.LogInformation("GetWellBeingDataAsync called for date: {Date}, category: {Category}, type: {Type}", date, category, type);
            var filter = new Dictionary<string, object>
            {
                ["date"] = date,
                ["category"] = category,
                ["type"] = type
            };
            var results = await _genericRepo.GetAsync("entry_data", filter);
            if (results.Count > 0 && results[0] is object[] row && row.Length >= 4)
            {
                var dateVal = (DateTime)row[0];
                var categoryVal = row[1]?.ToString() ?? string.Empty;
                var typeVal = row[2]?.ToString() ?? string.Empty;
                var valuesList = row[3] as string[] ?? Array.Empty<string>();
                _logger.LogInformation("GetWellBeingDataAsync found data for date: {Date}, category: {Category}, type: {Type}", date, category, type);
                return new WellBeingData(DateOnly.FromDateTime(dateVal), categoryVal, typeVal, valuesList.ToList());
            }
            _logger.LogWarning("GetWellBeingDataAsync found no data for date: {Date}, category: {Category}, type: {Type}", date, category, type);
            return null;
        }

        public async Task<IEnumerable<WellBeingData>> GetAllAsync(
            DateOnly? startDate,
            DateOnly? endDate,
            IList<(string Category, string Type)> dataTypes)
        {
            _logger.LogInformation("GetAllAsync called with startDate: {StartDate}, endDate: {EndDate}, dataTypes count: {Count}", startDate, endDate, dataTypes?.Count ?? 0);
            var allData = await GetAllDataFromDbAsync();
            var filtered = allData.Where(data =>
                (!startDate.HasValue || data.Date >= startDate.Value) && !
                (!endDate.HasValue || data.Date <= endDate.Value) &&
                (
                    dataTypes == null || dataTypes.Count == 0 ||
                    dataTypes.Any(dt => string.Equals(data.Category, dt.Category, StringComparison.OrdinalIgnoreCase) &&
                                        string.Equals(data.Type, dt.Type, StringComparison.OrdinalIgnoreCase))
                )
            );
            var resultList = filtered.ToList();
            _logger.LogInformation("GetAllAsync returning {Count} records", resultList.Count);
            return resultList;
        }
        private async Task<IEnumerable<WellBeingData>> GetAllDataFromDbAsync()
        {
            _logger.LogInformation("GetAllDataFromDbAsync called");
            var allData = new List<WellBeingData>();
            var rows = await _genericRepo.GetAllAsync("entry_data");
            foreach (var row in rows)
            {
                if (row is object[] arr && arr.Length >= 4)
                {
                    var dateVal = (DateTime)arr[0];
                    var category = arr[1]?.ToString() ?? string.Empty;
                    var type = arr[2]?.ToString() ?? string.Empty;
                    var valuesList = arr[3] as string[] ?? Array.Empty<string>();
                    allData.Add(new WellBeingData(DateOnly.FromDateTime(dateVal), category, type, valuesList.ToList()));
                }
            }
            _logger.LogInformation("GetAllDataFromDbAsync returning {Count} records", allData.Count);
            return allData;
        }

        // --- Observation Type/Value Management ---
        public async Task CreateWellBeingTypeAsync(string category, string type, bool allowMultipleSelection)
        {
            _logger.LogInformation("CreateWellBeingTypeAsync called for category: {Category}, type: {Type}, allowMultiple: {AllowMultiple}", category, type, allowMultipleSelection);
            var dict = new Dictionary<string, object>
            {
                ["type"] = type,
                ["category"] = category,
                ["allows_multiple"] = allowMultipleSelection
            };
            await _genericRepo.AddAsync("entry_definitions", dict);
            _logger.LogInformation("CreateWellBeingTypeAsync completed for category: {Category}, type: {Type}", category, type);
        }

        public async Task DeleteWellBeingTypeAsync(string category, string type)
        {
            _logger.LogInformation("DeleteWellBeingTypeAsync called for category: {Category}, type: {Type}", category, type);
            var filter = new Dictionary<string, object>
            {
                ["type"] = type,
                ["category"] = "observation"
            };
            await _genericRepo.RemoveAsync("entry_definitions", filter);
            _logger.LogInformation("DeleteWellBeingTypeAsync completed for category: {Category}, type: {Type}", category, type);
        }

        public async Task AddWellBeingValueAsync(string type, string value, bool notable)
        {
            _logger.LogInformation("AddWellBeingValueAsync called for type: {Type}, value: {Value}, notable: {Notable}", type, value, notable);
            var dict = new Dictionary<string, object>
            {
                ["parent_type"] = type,
                ["value"] = value,
                ["is_notable"] = notable
            };
            await _genericRepo.AddAsync("entry_values", dict);
            _logger.LogInformation("AddWellBeingValueAsync completed for type: {Type}, value: {Value}", type, value);
        }

        public async Task DeleteWellBeingValueAsync(string type, string value)
        {
            _logger.LogInformation("DeleteWellBeingValueAsync called for type: {Type}, value: {Value}", type, value);
            var filter = new Dictionary<string, object>
            {
                ["parent_type"] = type,
                ["value"] = value
            };
            await _genericRepo.RemoveAsync("entry_values", filter);
            _logger.LogInformation("DeleteWellBeingValueAsync completed for type: {Type}, value: {Value}", type, value);
        }

        public async Task<WellBeingValuesDefinition> GetWellBeingValuesAsync(string type)
        {
            _logger.LogInformation("GetWellBeingValuesAsync called for type: {Type}", type);
            var filter = new Dictionary<string, object> { ["parent_type"] = type };
            var rows = await _genericRepo.GetAsync("entry_values", filter);
            var values = new List<(string Value, bool Noticeable)>();
            foreach (var row in rows)
            {
                if (row is object[] arr && arr.Length >= 4)
                {
                    var value = arr[2]?.ToString();
                    var notable = Convert.ToBoolean(arr[3]);
                    if (value != null)
                        values.Add((value, notable));
                }
            }
            _logger.LogInformation("GetWellBeingValuesAsync returning {Count} values for type: {Type}", values.Count, type);
            return new WellBeingValuesDefinition(values);
        }

        public async Task<List<WellBeingDefinition>> GetWellBeingDefinitionAsync(string category)
        {
            _logger.LogInformation("GetWellBeingDefinitionAsync called for category: {Category}", category);
            var filter = new Dictionary<string, object> { ["category"] = category };
            var rows = await _genericRepo.GetAsync("entry_definitions", filter);
            var result = new List<WellBeingDefinition>();
            foreach (var row in rows)
            {
                if (row is object[] arr && arr.Length >= 3)
                {
                    var type = arr[1]?.ToString();
                    var cat = arr[2]?.ToString();
                    var allowMultiple = Convert.ToBoolean(arr[3]);
                    var valuesDef = await GetWellBeingValuesAsync(type!);
                    result.Add(new WellBeingDefinition(cat!, type!, valuesDef, allowMultiple));
                }
            }
            _logger.LogInformation("GetWellBeingDefinitionAsync returning {Count} definitions for category: {Category}", result.Count, category);
            return result;
        }
    }
}
