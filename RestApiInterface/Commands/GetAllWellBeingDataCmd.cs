namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to get all data, optionally filtered by (category, type) and/or by date range.
    /// </summary>
    public record GetAllWellBeingDataCmd(
        DateOnly? StartDate,
        DateOnly? EndDate,
        IList<(string Category, string Type)> DataTypes
    );
}
