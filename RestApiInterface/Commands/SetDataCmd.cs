using RestApiInterface.Data;

namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to set a well-being data item (Observation, Symptom, etc.)
    /// </summary>
    public record SetDataCmd(WellBeingData Data);
}
