using System.Data;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace WebApi.DataBase
{
    /// <summary>
    /// Generic repository for basic PostgreSQL operations.
    /// </summary>
    public class GenericPostgresRepository : IGenericPostgresRepository
    {
        private readonly string? _connectionString;
        private readonly ILogger<GenericPostgresRepository> _logger;

        public GenericPostgresRepository(string? connectionString, ILogger<GenericPostgresRepository> logger)
        {
            _connectionString = connectionString;
            _logger = logger;
        }

        public async Task AddAsync(string tableName, IDictionary<string, object> columnValues)
        {
            _logger.LogInformation("AddAsync called for table {Table} with columns: {Columns}", tableName, string.Join(", ", columnValues.Keys));
            var columns = string.Join(", ", columnValues.Keys);
            var parameters = string.Join(", ", columnValues.Keys.Select(k => "@" + k));
            var sql = $"INSERT INTO {tableName} ({columns}) VALUES ({parameters})";
            using var connection = new NpgsqlConnection(_connectionString);
            using var command = new NpgsqlCommand(sql, connection);
            foreach (var kvp in columnValues)
            {
                command.Parameters.AddWithValue($"@{kvp.Key}", kvp.Value ?? DBNull.Value);
            }
            await connection.OpenAsync();
            var result = await command.ExecuteNonQueryAsync();
            _logger.LogInformation("AddAsync executed for table {Table}, affected rows: {Rows}", tableName, result);
        }

        public async Task RemoveAsync(string tableName, IDictionary<string, object> filters)
        {
            _logger.LogInformation("RemoveAsync called for table {Table} with filters: {Filters}", tableName, string.Join(", ", filters.Keys));
            var where = string.Join(" AND ", filters.Keys.Select(k => $"{k} = @{k}"));
            var sql = $"DELETE FROM {tableName} WHERE {where}";
            using var connection = new NpgsqlConnection(_connectionString);
            using var command = new NpgsqlCommand(sql, connection);
            foreach (var kvp in filters)
            {
                command.Parameters.AddWithValue($"@{kvp.Key}", kvp.Value ?? DBNull.Value);
            }
            await connection.OpenAsync();
            var result = await command.ExecuteNonQueryAsync();
            _logger.LogInformation("RemoveAsync executed for table {Table}, affected rows: {Rows}", tableName, result);
        }

        public async Task<IList<object>> GetAsync(string tableName, IDictionary<string, object> filters)
        {
            _logger.LogInformation("GetAsync called for table {Table} with filters: {Filters}", tableName, string.Join(", ", filters.Keys));
            var where = filters.Count > 0
                ? "WHERE " + string.Join(" AND ", filters.Keys.Select(k => $"{k} = @{k}"))
                : string.Empty;
            var sql = $"SELECT * FROM {tableName} {where}";
            using var connection = new NpgsqlConnection(_connectionString);
            using var command = new NpgsqlCommand(sql, connection);
            foreach (var kvp in filters)
            {
                command.Parameters.AddWithValue($"@{kvp.Key}", kvp.Value ?? DBNull.Value);
            }
            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<object>();
            while (await reader.ReadAsync())
            {
                var values = new object[reader.FieldCount];
                reader.GetValues(values);
                results.Add(values);
            }
            _logger.LogInformation("GetAsync executed for table {Table}, returned {Count} rows", tableName, results.Count);
            return results;
        }

        public async Task UpdateAsync(string tableName, IDictionary<string, object> columnValues, IDictionary<string, object> filters)
        {
            _logger.LogInformation("UpdateAsync called for table {Table} with columns: {Columns} and filters: {Filters}", tableName, string.Join(", ", columnValues.Keys), string.Join(", ", filters.Keys));
            var setClause = string.Join(", ", columnValues.Keys.Select(k => $"{k} = @{k}"));
            var whereClause = string.Join(" AND ", filters.Keys.Select(k => $"{k} = @f_{k}"));
            var sql = $"UPDATE {tableName} SET {setClause} WHERE {whereClause}";
            using var connection = new NpgsqlConnection(_connectionString);
            using var command = new NpgsqlCommand(sql, connection);
            foreach (var kvp in columnValues)
            {
                command.Parameters.AddWithValue($"@{kvp.Key}", kvp.Value ?? DBNull.Value);
            }
            foreach (var kvp in filters)
            {
                command.Parameters.AddWithValue($"@f_{kvp.Key}", kvp.Value ?? DBNull.Value);
            }
            await connection.OpenAsync();
            var result = await command.ExecuteNonQueryAsync();
            _logger.LogInformation("UpdateAsync executed for table {Table}, affected rows: {Rows}", tableName, result);
        }

        public async Task<IList<object>> GetAllAsync(string tableName)
        {
            _logger.LogInformation("GetAllAsync called for table {Table}", tableName);
            var sql = $"SELECT * FROM {tableName}";
            using var connection = new NpgsqlConnection(_connectionString);
            using var command = new NpgsqlCommand(sql, connection);
            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<object>();
            while (await reader.ReadAsync())
            {
                var values = new object[reader.FieldCount];
                reader.GetValues(values);
                results.Add(values);
            }
            _logger.LogInformation("GetAllAsync executed for table {Table}, returned {Count} rows", tableName, results.Count);
            return results;
        }
    }
}
