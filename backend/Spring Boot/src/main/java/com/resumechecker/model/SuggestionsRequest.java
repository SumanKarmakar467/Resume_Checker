// Purpose: Capture frontend payload for generating Gemini suggestions.
package com.resumechecker.model;

public record SuggestionsRequest(
        String resumeText,
        String jobDescription
) {
}
