namespace RestApiInterface.Data
{
    /// <summary>
    /// The type of symptom (e.g., Headache, Tiredness, Nausea, etc.)
    /// </summary>
    public enum SymptomType
    {
        None,
        Headache,
        Tiredness,
        Nausea,
        Allergy,
        Other
    }

    /// <summary>
    /// Represents a daily symptom (e.g., headache, tiredness, nausea, etc.)
    /// </summary>
    public record Symptom(
        DateOnly Date,
        object? Value,
        SymptomType SymptomType
    ) : WellBeingData(Date, Value);
}
