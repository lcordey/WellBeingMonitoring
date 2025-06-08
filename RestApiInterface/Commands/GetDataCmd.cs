using RestApiInterface.Data;

namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to get data for a given date, with optional observation or symptom type.
    /// </summary>
    public record GetDataCmd(DateOnly Date, ObservationType? ObservationType, SymptomType? SymptomType);
}
