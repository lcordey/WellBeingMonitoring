namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to get well-being data (Observation, Symptom, etc.) for a given date.
    /// </summary>
    public record GetDataCmd(DateOnly Date);
}
