using System.Text.Json.Serialization;

namespace RestApiInterface.Data
{
    /// <summary>
    /// Marker interface for all well-being data types (e.g., Observation, Symptom).
    /// </summary>
    [JsonPolymorphic(TypeDiscriminatorPropertyName = "dataType")]
    [JsonDerivedType(typeof(Observation), "observation")]
    [JsonDerivedType(typeof(Symptom), "symptom")]
    public record WellBeingData { }
}
