using System.Text.Json.Serialization;

namespace RestApiInterface.Data
{
    /// <summary>
    /// Marker interface for all well-being data types (e.g., Observation, Symptom).
    /// </summary>
    public record WellBeingData(
        DateOnly Date,
        string Category,
        string Type,
        List<string> Values
    );
}
