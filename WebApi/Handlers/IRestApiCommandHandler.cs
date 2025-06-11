using RestApiInterface.Data;
using RestApiInterface.Commands;

namespace WebApi.Handlers
{
    /// <summary>
    /// Generic interface for handling REST API commands (set, get, etc.).
    /// </summary>
    public interface IRestApiCommandHandler
    {
        Task SetDataAsync(SetDataCmd command);
        Task<IEnumerable<WellBeingData>> GetAllDataAsync(GetAllDataCmd command);
    }
}
