using System;

namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to remove an existing well-being data entry.
    /// </summary>
    public record DeleteWellBeingDataCmd(DateOnly Date, string Category, string Type);
}
