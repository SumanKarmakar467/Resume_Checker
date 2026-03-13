package com.resumechecker.model;

public record PanelScores(
        int contentScore,
        int sectionsScore,
        int atsEssentialsScore,
        int tailoringScore
) {
}
