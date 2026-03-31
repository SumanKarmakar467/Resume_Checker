package com.resumechecker.model;

public record GenerateResumeRequest(
        String resumeText,
        String jobDescription,
        String templateName
) {
}
