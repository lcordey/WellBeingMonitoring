namespace RestApiInterface.Data
{
    public record WellBeingValue(string Value, bool Noticeable);
    public record WellBeingValuesDefinition(List<WellBeingValue> Values);
    public record WellBeingDefinition(string Category, string Type, WellBeingValuesDefinition Values, bool AllowMultiple);
}
