// Purpose: Return ATS rewrite suggestions to the frontend.
package com.resumechecker.model;

import java.util.List;

public record SuggestionsResponse(
        List<Suggestion> suggestions
) {
}
