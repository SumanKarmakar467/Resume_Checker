// Purpose: Persist resume analysis history per authenticated user.
package com.resumechecker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "resume_history")
public class ResumeHistory {
    @Id
    private String id;

    private String userId;
    private String resumeFileName;
    private String jobTitle;
    private int atsScore;
    private List<String> matchedKeywords;
    private List<String> missingKeywords;
    private Map<String, Integer> sections;
    private Instant createdAt;

    public ResumeHistory() {
    }

    public ResumeHistory(
            String id,
            String userId,
            String resumeFileName,
            String jobTitle,
            int atsScore,
            List<String> matchedKeywords,
            List<String> missingKeywords,
            Map<String, Integer> sections,
            Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.resumeFileName = resumeFileName;
        this.jobTitle = jobTitle;
        this.atsScore = atsScore;
        this.matchedKeywords = matchedKeywords;
        this.missingKeywords = missingKeywords;
        this.sections = sections;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getResumeFileName() {
        return resumeFileName;
    }

    public void setResumeFileName(String resumeFileName) {
        this.resumeFileName = resumeFileName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public int getAtsScore() {
        return atsScore;
    }

    public void setAtsScore(int atsScore) {
        this.atsScore = atsScore;
    }

    public List<String> getMatchedKeywords() {
        return matchedKeywords;
    }

    public void setMatchedKeywords(List<String> matchedKeywords) {
        this.matchedKeywords = matchedKeywords;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public Map<String, Integer> getSections() {
        return sections;
    }

    public void setSections(Map<String, Integer> sections) {
        this.sections = sections;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
