using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace WebApi.DataBase
{
    /// <summary>
    /// In-memory implementation of <see cref="IGenericPostgresRepository"/> used to simulate
    /// a PostgreSQL database during automated testing.
    /// </summary>
    public class InMemoryGenericRepository : IGenericPostgresRepository
    {
        private readonly ConcurrentDictionary<string, List<Dictionary<string, object?>>> _tables =
            new(StringComparer.OrdinalIgnoreCase);
        private readonly ILogger<InMemoryGenericRepository> _logger;
        private readonly object _syncRoot = new();

        public InMemoryGenericRepository(ILogger<InMemoryGenericRepository> logger)
        {
            _logger = logger;
        }

        public Task AddAsync(string tableName, IDictionary<string, object> columnValues)
        {
            _logger.LogInformation("[InMemory] AddAsync on {Table} with {Columns}", tableName, string.Join(", ", columnValues.Keys));
            var table = GetOrCreateTable(tableName);
            var row = NormalizeRow(tableName, columnValues);
            lock (_syncRoot)
            {
                table.Add(row);
            }
            return Task.CompletedTask;
        }

        public Task RemoveAsync(string tableName, IDictionary<string, object> filters)
        {
            _logger.LogInformation("[InMemory] RemoveAsync on {Table} with filters {Filters}", tableName, string.Join(", ", filters.Keys));
            var table = GetOrCreateTable(tableName);
            var normalizedFilters = NormalizeFilters(tableName, filters);
            lock (_syncRoot)
            {
                table.RemoveAll(row => MatchesFilters(tableName, row, normalizedFilters));
            }
            return Task.CompletedTask;
        }

        public Task<IList<object>> GetAsync(string tableName, IDictionary<string, object> filters)
        {
            _logger.LogInformation("[InMemory] GetAsync on {Table} with filters {Filters}", tableName, string.Join(", ", filters.Keys));
            var table = GetOrCreateTable(tableName);
            var normalizedFilters = NormalizeFilters(tableName, filters);
            IList<object> result;
            lock (_syncRoot)
            {
                result = table
                    .Where(row => MatchesFilters(tableName, row, normalizedFilters))
                    .Select(row => MapRowToResult(tableName, row))
                    .Cast<object>()
                    .ToList();
            }
            return Task.FromResult(result);
        }

        public Task UpdateAsync(string tableName, IDictionary<string, object> columnValues, IDictionary<string, object> filters)
        {
            _logger.LogInformation("[InMemory] UpdateAsync on {Table} with columns {Columns} and filters {Filters}",
                tableName,
                string.Join(", ", columnValues.Keys),
                string.Join(", ", filters.Keys));
            var table = GetOrCreateTable(tableName);
            var normalizedFilters = NormalizeFilters(tableName, filters);
            var normalizedColumns = NormalizeFilters(tableName, columnValues);
            lock (_syncRoot)
            {
                foreach (var row in table.Where(r => MatchesFilters(tableName, r, normalizedFilters)))
                {
                    foreach (var (key, value) in normalizedColumns)
                    {
                        row[key] = value;
                    }
                }
            }
            return Task.CompletedTask;
        }

        public Task<IList<object>> GetAllAsync(string tableName)
        {
            _logger.LogInformation("[InMemory] GetAllAsync on {Table}", tableName);
            var table = GetOrCreateTable(tableName);
            IList<object> result;
            lock (_syncRoot)
            {
                result = table
                    .Select(row => MapRowToResult(tableName, row))
                    .Cast<object>()
                    .ToList();
            }
            return Task.FromResult(result);
        }

        private List<Dictionary<string, object?>> GetOrCreateTable(string tableName)
        {
            return _tables.GetOrAdd(tableName, _ => new List<Dictionary<string, object?>>());
        }

        private Dictionary<string, object?> NormalizeRow(string tableName, IDictionary<string, object> values)
        {
            var normalized = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in values)
            {
                normalized[NormalizeKey(kvp.Key)] = NormalizeValue(tableName, kvp.Key, kvp.Value);
            }

            // Ensure surrogate keys exist for tables that typically have them in Postgres
            if (tableName.Equals("entry_definitions", StringComparison.OrdinalIgnoreCase) && !normalized.ContainsKey("id"))
            {
                normalized["id"] = Guid.NewGuid();
            }
            if (tableName.Equals("entry_values", StringComparison.OrdinalIgnoreCase) && !normalized.ContainsKey("id"))
            {
                normalized["id"] = Guid.NewGuid();
            }

            return normalized;
        }

        private Dictionary<string, object?> NormalizeFilters(string tableName, IDictionary<string, object> filters)
        {
            var normalized = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in filters)
            {
                normalized[NormalizeKey(kvp.Key)] = NormalizeValue(tableName, kvp.Key, kvp.Value);
            }
            return normalized;
        }

        private string NormalizeKey(string key) => key.ToLowerInvariant();

        private object? NormalizeValue(string tableName, string key, object value)
        {
            var normalizedKey = NormalizeKey(key);
            if (tableName.Equals("entry_data", StringComparison.OrdinalIgnoreCase) && normalizedKey == "date")
            {
                return value switch
                {
                    DateOnly d => d,
                    DateTime dt => DateOnly.FromDateTime(dt),
                    string s when DateOnly.TryParse(s, out var parsed) => parsed,
                    _ => value
                };
            }

            if (normalizedKey is "allows_multiple" or "is_notable")
            {
                return Convert.ToBoolean(value);
            }

            if (normalizedKey == "values_list")
            {
                if (value is IEnumerable<string> enumerable)
                {
                    return enumerable.ToArray();
                }
                if (value is string[] arr)
                {
                    return arr;
                }
                if (value is IEnumerable<object> objEnum)
                {
                    return objEnum.Select(o => o?.ToString() ?? string.Empty).ToArray();
                }
            }

            return value;
        }

        private bool MatchesFilters(string tableName, Dictionary<string, object?> row, IDictionary<string, object?> filters)
        {
            foreach (var (key, value) in filters)
            {
                if (!row.TryGetValue(key, out var rowValue))
                {
                    return false;
                }

                if (!ValuesEqual(tableName, key, rowValue, value))
                {
                    return false;
                }
            }
            return true;
        }

        private bool ValuesEqual(string tableName, string key, object? left, object? right)
        {
            if (left is null && right is null)
            {
                return true;
            }
            if (left is null || right is null)
            {
                return false;
            }

            var normalizedKey = NormalizeKey(key);
            if (tableName.Equals("entry_data", StringComparison.OrdinalIgnoreCase) && normalizedKey == "date")
            {
                var leftDate = left is DateOnly ld ? ld : left is DateTime ldt ? DateOnly.FromDateTime(ldt) : DateOnly.Parse(left.ToString()!);
                var rightDate = right is DateOnly rd ? rd : right is DateTime rdt ? DateOnly.FromDateTime(rdt) : DateOnly.Parse(right.ToString()!);
                return leftDate == rightDate;
            }

            if (left is string lStr && right is string rStr)
            {
                return string.Equals(lStr, rStr, StringComparison.OrdinalIgnoreCase);
            }

            if (left is Guid lGuid && right is Guid rGuid)
            {
                return lGuid == rGuid;
            }

            if (left is bool lBool)
            {
                return lBool == Convert.ToBoolean(right);
            }

            return Equals(left, right);
        }

        private object[] MapRowToResult(string tableName, Dictionary<string, object?> row)
        {
            if (tableName.Equals("entry_data", StringComparison.OrdinalIgnoreCase))
            {
                var date = row.TryGetValue("date", out var dateValue) && dateValue is DateOnly d
                    ? d.ToDateTime(TimeOnly.MinValue)
                    : dateValue;
                var category = row.TryGetValue("category", out var categoryValue) ? categoryValue : null;
                var type = row.TryGetValue("type", out var typeValue) ? typeValue : null;
                var values = row.TryGetValue("values_list", out var valuesValue) && valuesValue is string[] arr
                    ? arr
                    : Array.Empty<string>();
                return [date!, category!, type!, values ];
            }

            if (tableName.Equals("entry_definitions", StringComparison.OrdinalIgnoreCase))
            {
                var id = row.TryGetValue("id", out var idValue) ? idValue ?? Guid.NewGuid() : Guid.NewGuid();
                var type = row.TryGetValue("type", out var typeValue) ? typeValue : null;
                var category = row.TryGetValue("category", out var categoryValue) ? categoryValue : null;
                var allowsMultiple = row.TryGetValue("allows_multiple", out var allowValue) ? allowValue ?? false : false;
                return [id, type!, category!, allowsMultiple ];
            }

            if (tableName.Equals("entry_values", StringComparison.OrdinalIgnoreCase))
            {
                var id = row.TryGetValue("id", out var idValue) ? idValue ?? Guid.NewGuid() : Guid.NewGuid();
                var parentType = row.TryGetValue("parent_type", out var parentTypeValue) ? parentTypeValue : null;
                var value = row.TryGetValue("value", out var valueValue) ? valueValue : null;
                var notable = row.TryGetValue("is_notable", out var notableValue) ? notableValue ?? false : false;
                return [id, parentType!, value!, notable ];
            }

            // Default: return values in insertion order
            return [row.Values.Select(v => v as object ?? v!)];
        }
    }
}
