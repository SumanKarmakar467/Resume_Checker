// Purpose: Represent a single ATS rewrite suggestion returned by Gemini.
package com.resumechecker.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Suggestion(
        @JsonProperty("weak_line") String weakLine,
        @JsonProperty("improved_line") String improvedLine,
        @JsonProperty("reason") String reason
) {
}
