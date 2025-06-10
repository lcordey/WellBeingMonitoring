using RestApiInterface.Data;

namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to get all data, optionally filtered by observation or symptom type and/or by date range.
    /// </summary>
    public record GetAllDataCmd(
        DateOnly? StartDate,
        DateOnly? EndDate,
        ObservationType? ObservationType,
        SymptomType? SymptomType
    );
}
