package com.resumechecker.model;

import java.util.List;

public record SectionFeedback(
        String section,
        int score,
        String status,
        List<String> issues,
        List<String> suggestions
) {
}
