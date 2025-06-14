namespace RestApiInterface.Data
{
    public record WellBeingValuesDefinition(List<(string Value, bool Noticeable)> Values);
    public record WellBeingDefinition(string Category, string Type, WellBeingValuesDefinition Values, bool AllowMultiple);
}
