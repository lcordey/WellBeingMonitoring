using System.Collections.Generic;

namespace RestApiInterface.Data
{
    public record WellBeingCategoryTypes(string Category, IReadOnlyList<string> Types);
}
