namespace RestApiInterface.Commands;

public record CreateWellBeingTypeCmd(string Category, string Type, bool AllowMultipleSelection);