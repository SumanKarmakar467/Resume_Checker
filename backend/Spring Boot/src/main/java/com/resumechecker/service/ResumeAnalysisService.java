package com.resumechecker.service;

import com.resumechecker.model.PanelScores;
import com.resumechecker.model.ResumeAnalysisResponse;
import com.resumechecker.model.SectionFeedback;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResumeAnalysisService {
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "your", "from", "that", "this", "have", "has", "was", "are", "you",
            "our", "their", "about", "will", "would", "there", "what", "when", "where", "into", "onto", "able",
            "years", "year", "work", "role", "team", "using", "skills", "skill", "experience", "resume", "job"
    );

    public ResumeAnalysisResponse analyzeResume(String resumeText, String jobDescription) {
        String safeResume = resumeText == null ? "" : resumeText;
        String normalizedResume = normalize(safeResume);

        List<SectionFeedback> sections = new ArrayList<>();
        sections.add(scoreContactInfo(normalizedResume, safeResume));
        sections.add(scoreSummary(normalizedResume));
        sections.add(scoreSkills(normalizedResume));
        sections.add(scoreExperience(normalizedResume));
        sections.add(scoreEducation(normalizedResume));
        sections.add(scoreFormatting(safeResume, normalizedResume));

        List<String> keywords = extractKeywords(jobDescription);
        KeywordResult keywordResult = scoreKeywordMatch(normalizedResume, keywords);
        sections.add(keywordResult.feedback);

        int overallScore = (int) Math.round(
                sections.stream().mapToInt(SectionFeedback::score).average().orElse(0)
        );

        LinkedHashSet<String> uniqueSuggestions = new LinkedHashSet<>();
        for (SectionFeedback section : sections) {
            if (section.score() < 70) uniqueSuggestions.addAll(section.suggestions());
        }
        List<String> suggestions = uniqueSuggestions.isEmpty()
                ? List.of("Great baseline ATS compatibility. Tailor your resume for each job description before applying.")
                : new ArrayList<>(uniqueSuggestions);

        PanelScores panelScores = calculatePanelScores(sections);

        return new ResumeAnalysisResponse(
                clamp(overallScore),
                sections,
                keywordResult.matchedKeywords,
                keywordResult.missingKeywords,
                panelScores,
                suggestions,
                safeResume
        );
    }

    public String generateAtsFriendlyResume(String resumeText, String jobDescription) {
        String safeResume = resumeText == null ? "" : resumeText;
        String normalized = normalize(safeResume);
        List<String> keywords = extractKeywords(jobDescription);
        List<String> missingKeywords = keywords.stream().filter(k -> !normalized.contains(k)).toList();

        String name = findFirst(safeResume, Pattern.compile("(?m)^(?:[A-Z][A-Za-z\\s]{2,})$"), "Your Name");
        String email = findFirst(safeResume, Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"), "youremail@example.com");
        String phone = findFirst(safeResume, Pattern.compile("(?:\\+?\\d{1,3}[\\s-]?)?(?:\\(?\\d{3}\\)?[\\s-]?)?\\d{3}[\\s-]?\\d{4}"), "+1 000 000 0000");

        List<String> summaryKeywords = missingKeywords.subList(0, Math.min(6, missingKeywords.size()));
        List<String> skillKeywords = keywords.subList(0, Math.min(10, keywords.size()));
        List<String> noteKeywords = missingKeywords.subList(0, Math.min(15, missingKeywords.size()));

        StringBuilder output = new StringBuilder();
        output.append(name).append("\n")
                .append(email).append(" | ").append(phone).append("\n\n")
                .append("PROFESSIONAL SUMMARY\n")
                .append("Results-driven professional with experience delivering measurable outcomes and collaborating across teams. ");

        if (!summaryKeywords.isEmpty()) {
            output.append("Core focus areas include ").append(String.join(", ", summaryKeywords)).append(".\n\n");
        } else {
            output.append("Experienced in aligning deliverables with role-specific requirements.\n\n");
        }

        output.append("CORE SKILLS\n");
        if (!skillKeywords.isEmpty()) {
            for (String skill : skillKeywords) {
                output.append("- ").append(capitalize(skill)).append("\n");
            }
        } else {
            output.append("- Communication\n- Problem Solving\n- Team Collaboration\n");
        }

        output.append("\nPROFESSIONAL EXPERIENCE\n")
                .append("Job Title | Company Name | MM/YYYY - Present\n")
                .append("- Implemented key projects that improved process efficiency and quality metrics.\n")
                .append("- Collaborated with stakeholders to deliver outcomes aligned with business goals.\n")
                .append("- Used relevant tools and methods to solve problems and optimize delivery.\n\n")
                .append("EDUCATION\n")
                .append("Degree Name | University Name | Year\n\n")
                .append("ATS OPTIMIZATION NOTES\n");

        if (!noteKeywords.isEmpty()) {
            output.append("- Add these keywords naturally in summary/experience: ")
                    .append(String.join(", ", noteKeywords))
                    .append("\n");
        } else {
            output.append("- Resume already contains most job-description keywords.\n");
        }
        output.append("- Keep formatting simple (single column, standard headings, no text in images).\n");

        return output.toString();
    }

    private String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private SectionFeedback scoreContactInfo(String normalizedResume, String rawResume) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        boolean hasEmail = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}").matcher(rawResume).find();
        boolean hasPhone = Pattern.compile("(?:\\+?\\d{1,3}[\\s-]?)?(?:\\(?\\d{3}\\)?[\\s-]?)?\\d{3}[\\s-]?\\d{4}").matcher(rawResume).find();
        boolean hasLinkedIn = normalizedResume.contains("linkedin");

        int score = 0;
        if (hasEmail) score += 40;
        else {
            issues.add("Email is missing or not detected.");
            suggestions.add("Add a professional email address in the resume header.");
        }
        if (hasPhone) score += 40;
        else {
            issues.add("Phone number is missing or not detected.");
            suggestions.add("Include a valid phone number with country code.");
        }
        if (hasLinkedIn) score += 20;
        else {
            issues.add("LinkedIn profile is missing.");
            suggestions.add("Add a LinkedIn profile URL to improve recruiter trust.");
        }

        return feedback("Contact Information", score, issues, suggestions);
    }

    private SectionFeedback scoreSummary(String normalizedResume) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        boolean hasHeading = normalizedResume.contains("summary")
                || normalizedResume.contains("professional profile")
                || normalizedResume.contains("objective");

        int words = normalizedResume.isBlank() ? 0 : normalizedResume.split("\\s+").length;
        int score = 0;

        if (hasHeading) score += 60;
        else {
            issues.add("Summary/objective section heading not found.");
            suggestions.add("Add a clear 'Professional Summary' section near the top.");
        }

        if (words >= 180) score += 40;
        else {
            issues.add("Resume content appears very short.");
            suggestions.add("Expand summary with impact, tools, and role-specific strengths.");
        }

        return feedback("Professional Summary", score, issues, suggestions);
    }

    private SectionFeedback scoreSkills(String normalizedResume) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        boolean hasHeading = normalizedResume.contains("skills") || normalizedResume.contains("technical skills");

        List<String> skillWords = List.of("java", "spring", "react", "sql", "python", "aws", "docker", "git", "rest", "api");
        int detected = countMatches(normalizedResume, skillWords);

        int score = 0;
        if (hasHeading) score += 55;
        else {
            issues.add("Skills section heading not detected.");
            suggestions.add("Create a dedicated 'Skills' section with relevant tools and technologies.");
        }

        score += Math.min(detected * 5, 45);
        if (detected < 6) {
            issues.add("Limited technical keyword coverage.");
            suggestions.add("Add more role-aligned skills from the job description.");
        }

        return feedback("Skills", score, issues, suggestions);
    }

    private SectionFeedback scoreExperience(String normalizedResume) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        boolean hasHeading = normalizedResume.contains("experience") || normalizedResume.contains("work history");
        List<String> verbs = List.of("built", "developed", "designed", "led", "improved", "implemented", "optimized", "delivered", "created", "managed");
        int actionVerbs = countMatches(normalizedResume, verbs);
        boolean hasNumbers = Pattern.compile("\\b\\d+%?\\b").matcher(normalizedResume).find();

        int score = 0;
        if (hasHeading) score += 45;
        else {
            issues.add("Work experience section heading not detected.");
            suggestions.add("Add an 'Experience' section with company, role, and dates.");
        }

        score += Math.min(actionVerbs * 4, 35);
        if (actionVerbs < 5) {
            issues.add("Experience bullets are not impact-oriented.");
            suggestions.add("Use strong action verbs at the start of each experience bullet.");
        }

        if (hasNumbers) score += 20;
        else {
            issues.add("No measurable outcomes found.");
            suggestions.add("Add metrics like %, counts, or time saved in experience points.");
        }

        return feedback("Experience", score, issues, suggestions);
    }

    private SectionFeedback scoreEducation(String normalizedResume) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        boolean hasHeading = normalizedResume.contains("education");
        boolean hasDegree = List.of("b.tech", "bachelor", "master", "m.tech", "bsc", "msc", "degree", "university", "college")
                .stream().anyMatch(normalizedResume::contains);

        int score = 0;
        if (hasHeading) score += 55;
        else {
            issues.add("Education section heading not detected.");
            suggestions.add("Add an Education section with degree, college, and year.");
        }
        if (hasDegree) score += 45;
        else {
            issues.add("Degree/institute details look incomplete.");
            suggestions.add("Include degree name, institute, and graduation year.");
        }

        return feedback("Education", score, issues, suggestions);
    }

    private SectionFeedback scoreFormatting(String rawResume, String normalizedResume) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        String[] lines = rawResume.split("\\R");
        int headingCount = 0;
        int bulletCount = 0;
        for (String line : lines) {
            String t = line.trim();
            if (t.isEmpty()) continue;
            if (t.matches("^[A-Z][A-Z\\s&]{2,}$")) headingCount++;
            if (t.startsWith("-") || t.startsWith("*")) bulletCount++;
        }

        int words = normalizedResume.isBlank() ? 0 : normalizedResume.split("\\s+").length;
        int score = 30;

        if (words >= 250 && words <= 900) score += 25;
        else {
            issues.add("Resume length may be too short or too long for ATS screening.");
            suggestions.add("Keep resume around one page with concise, impact-focused bullets.");
        }

        if (headingCount >= 3) score += 25;
        else {
            issues.add("Resume headings are weak or missing.");
            suggestions.add("Use clear headings like SUMMARY, SKILLS, EXPERIENCE, EDUCATION.");
        }

        if (bulletCount >= 6) score += 20;
        else {
            issues.add("Not enough bullet points for readable ATS structure.");
            suggestions.add("Use bullet points in experience/projects for easier parsing.");
        }

        return feedback("Formatting", score, issues, suggestions);
    }

    private KeywordResult scoreKeywordMatch(String normalizedResume, List<String> keywords) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> matched = new ArrayList<>();

        if (keywords.isEmpty()) {
            issues.add("Job description was not provided, so keyword alignment is estimated.");
            suggestions.add("Add the job description for role-specific keyword matching.");
            return new KeywordResult(feedback("Keyword Match", 70, issues, suggestions), missing, matched);
        }

        int count = 0;
        for (String keyword : keywords) {
            if (normalizedResume.contains(keyword)) {
                matched.add(keyword);
                count++;
            } else {
                missing.add(keyword);
            }
        }

        int score = (int) Math.round((count * 100.0) / keywords.size());
        if (score < 70) {
            issues.add("Resume is missing important job-specific keywords.");
            suggestions.add("Naturally add missing keywords in summary, skills, and experience sections.");
        }

        return new KeywordResult(
                feedback("Keyword Match", score, issues, suggestions),
                missing.subList(0, Math.min(20, missing.size())),
                matched.subList(0, Math.min(20, matched.size()))
        );
    }

    private List<String> extractKeywords(String jobDescription) {
        if (jobDescription == null || jobDescription.isBlank()) return List.of();

        String normalized = jobDescription.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", " ");
        String[] tokens = normalized.split("\\s+");
        List<String> keywords = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (String token : tokens) {
            if (token.length() < 3 || STOP_WORDS.contains(token) || seen.contains(token)) continue;
            seen.add(token);
            keywords.add(token);
            if (keywords.size() >= 30) break;
        }

        return keywords;
    }

    private int countMatches(String text, List<String> words) {
        int total = 0;
        for (String word : words) {
            if (text.contains(word)) total++;
        }
        return total;
    }

    private PanelScores calculatePanelScores(List<SectionFeedback> sections) {
        int contentScore = average(List.of(
                findScore(sections, "Professional Summary"),
                findScore(sections, "Skills"),
                findScore(sections, "Experience"),
                findScore(sections, "Keyword Match")
        ));

        int sectionsScore = average(List.of(
                findScore(sections, "Contact Information"),
                findScore(sections, "Skills"),
                findScore(sections, "Experience"),
                findScore(sections, "Education")
        ));

        int atsEssentialsScore = average(List.of(
                findScore(sections, "Keyword Match"),
                findScore(sections, "Formatting"),
                findScore(sections, "Contact Information")
        ));

        int tailoringScore = average(List.of(
                findScore(sections, "Keyword Match"),
                findScore(sections, "Professional Summary")
        ));

        return new PanelScores(contentScore, sectionsScore, atsEssentialsScore, tailoringScore);
    }

    private int findScore(List<SectionFeedback> sections, String name) {
        return sections.stream().filter(s -> s.section().equals(name)).findFirst().map(SectionFeedback::score).orElse(0);
    }

    private int average(List<Integer> values) {
        return (int) Math.round(values.stream().mapToInt(v -> v).average().orElse(0));
    }

    private SectionFeedback feedback(String section, int rawScore, List<String> issues, List<String> suggestions) {
        int score = clamp(rawScore);
        String status = "Low";
        if (score >= 80) status = "Strong";
        else if (score >= 60) status = "Needs Improvement";
        return new SectionFeedback(section, score, status, issues, suggestions);
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private String findFirst(String text, Pattern pattern, String fallback) {
        Matcher matcher = pattern.matcher(text == null ? "" : text);
        if (matcher.find() && matcher.group() != null) {
            String value = matcher.group().trim();
            if (!value.isEmpty()) return value;
        }
        return fallback;
    }

    private String capitalize(String value) {
        if (value == null || value.isEmpty()) return value;
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private record KeywordResult(SectionFeedback feedback, List<String> missingKeywords, List<String> matchedKeywords) {
    }
}
