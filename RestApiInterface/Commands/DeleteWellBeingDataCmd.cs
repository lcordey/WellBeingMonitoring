using System;

namespace RestApiInterface.Commands
{
    /// <summary>
    /// Command to delete a well-being data entry.
    /// </summary>
    public record DeleteWellBeingDataCmd(DateOnly Date, string Category, string Type);
}
