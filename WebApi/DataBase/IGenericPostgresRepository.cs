
namespace WebApi.DataBase
{
    /// <summary>
    /// Provides generic methods for interacting with a PostgreSQL database.
    /// </summary>
    public interface IGenericPostgresRepository
    {
        Task AddAsync(string tableName, IDictionary<string, object> columnValues);
        Task RemoveAsync(string tableName, IDictionary<string, object> filters);
        Task<IList<object>> GetAsync(string tableName, IDictionary<string, object> filters);
        Task UpdateAsync(string tableName, IDictionary<string, object> columnValues, IDictionary<string, object> filters);
        Task<IList<object>> GetAllAsync(string tableName);
    }
}
