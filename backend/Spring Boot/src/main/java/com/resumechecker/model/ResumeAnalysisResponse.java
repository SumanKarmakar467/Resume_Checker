package com.resumechecker.model;

import java.util.List;

public record ResumeAnalysisResponse(
        int overallScore,
        List<SectionFeedback> sections,
        List<String> matchedKeywords,
        List<String> missingKeywords,
        PanelScores panelScores,
        List<String> suggestions,
        String extractedText
) {
}
