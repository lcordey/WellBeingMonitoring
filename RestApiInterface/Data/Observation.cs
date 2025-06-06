namespace RestApiInterface.Data
{
    /// <summary>
    /// The type of observation (e.g., Alcohol, Sleep, Food, SunExposure, etc.)
    /// </summary>
    public enum ObservationType
    {
        Alcohol,
        Sleep,
        Food,
        SunExposure,
        Other
    }

    /// <summary>
    /// Represents a daily observation (e.g., alcohol, sleep, food, sun exposure, etc.)
    /// </summary>
    public record Observation(
        DateOnly Date,
        ObservationType ObservationType
    ) : WellBeingData;
}
