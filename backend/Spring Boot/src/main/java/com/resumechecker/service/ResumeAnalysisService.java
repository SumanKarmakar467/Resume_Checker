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

    /**
     * Analyze resume content against optional job description and return ATS diagnostics.
     *
     * @param resumeText raw extracted resume text
     * @param jobDescription target job description text
     * @return structured ATS analysis response
     */
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
        int atsScore = calculateAtsScore(normalizedResume, safeResume, keywordResult);

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
                atsScore,
                sections,
                keywordResult.matchedKeywords,
                keywordResult.missingKeywords,
                panelScores,
                suggestions,
                safeResume
        );
    }

    /**
     * Generate an ATS-friendly rewritten draft from parsed resume text.
     *
     * @param resumeText raw extracted resume text
     * @param jobDescription target job description text
     * @param templateName selected resume template name
     * @return generated ATS-friendly resume HTML
     */
    public String generateAtsFriendlyResume(String resumeText, String jobDescription, String templateName) {
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

        String summary = "Results-driven professional with experience delivering measurable outcomes and collaborating across teams.";
        if (!summaryKeywords.isEmpty()) {
            summary += " Core focus areas include " + String.join(", ", summaryKeywords) + ".";
        } else {
            summary += " Experienced in aligning deliverables with role-specific requirements.";
        }

        List<String> skills = !skillKeywords.isEmpty()
                ? skillKeywords.stream().map(this::capitalize).toList()
                : List.of("Communication", "Problem Solving", "Team Collaboration");

        List<String> experienceBullets = List.of(
                "Implemented key projects that improved process efficiency and quality metrics.",
                "Collaborated with stakeholders to deliver outcomes aligned with business goals.",
                "Used relevant tools and methods to solve problems and optimize delivery."
        );

        String notes;
        if (!noteKeywords.isEmpty()) {
            notes = "Add these keywords naturally in summary and experience: " + String.join(", ", noteKeywords) + ".";
        } else {
            notes = "Resume already contains most job-description keywords.";
        }

        GeneratedResumeContent content = new GeneratedResumeContent(
                name,
                "ATS-Optimized Resume",
                email,
                phone,
                summary,
                skills,
                experienceBullets,
                "Job Title | Company Name | MM/YYYY - Present",
                "Degree Name | University Name | Year",
                notes
        );

        return renderTemplate(templateName, content);
    }

    private String renderTemplate(String templateName, GeneratedResumeContent content) {
        String resolved = templateName == null ? "" : templateName.trim();
        return switch (resolved) {
            case "Modern Sidebar" -> modernSidebarTemplate(content);
            case "Minimal Clean" -> minimalCleanTemplate(content);
            case "With Photo - Executive" -> executiveTemplate(content);
            case "Creative Accent" -> creativeAccentTemplate(content);
            case "Tech / Developer" -> techDeveloperTemplate(content);
            case "Classic Professional" -> classicProfessionalTemplate(content);
            default -> classicProfessionalTemplate(content);
        };
    }

    private String classicProfessionalTemplate(GeneratedResumeContent content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #1f2937; background: #ffffff; }
                    .name { font-size: 30px; font-weight: 700; margin-bottom: 4px; }
                    .title { color: #2563eb; font-weight: 600; margin-bottom: 8px; }
                    .contact { font-size: 13px; color: #334155; margin-bottom: 20px; }
                    h2 { color: #1d4ed8; font-size: 15px; letter-spacing: 0.08em; margin: 18px 0 8px; text-transform: uppercase; }
                    p { margin: 0 0 10px; line-height: 1.55; font-size: 14px; }
                    ul { margin: 0; padding-left: 20px; }
                    li { margin: 6px 0; line-height: 1.45; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="name">%s</div>
                  <div class="title">%s</div>
                  <div class="contact">%s | %s</div>
                  <h2>Professional Summary</h2>
                  <p>%s</p>
                  <h2>Core Skills</h2>
                  <ul>%s</ul>
                  <h2>Professional Experience</h2>
                  <p><strong>%s</strong></p>
                  <ul>%s</ul>
                  <h2>Education</h2>
                  <p>%s</p>
                  <h2>ATS Notes</h2>
                  <p>%s</p>
                </body>
                </html>
                """.formatted(
                html(content.name()),
                html(content.title()),
                html(content.email()),
                html(content.phone()),
                html(content.summary()),
                htmlListItems(content.skills()),
                html(content.experienceHeader()),
                htmlListItems(content.experienceBullets()),
                html(content.educationLine()),
                html(content.optimizationNotes())
        );
    }

    private String modernSidebarTemplate(GeneratedResumeContent content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; }
                    .wrap { display: grid; grid-template-columns: 30% 70%; min-height: 100vh; }
                    .sidebar { background: #111827; color: #e5e7eb; padding: 28px 22px; }
                    .main { background: #ffffff; padding: 28px; }
                    .name { font-size: 26px; font-weight: 700; margin-bottom: 4px; color: #ffffff; }
                    .title { font-size: 13px; color: #93c5fd; margin-bottom: 16px; }
                    .label { font-size: 11px; letter-spacing: 0.1em; color: #9ca3af; text-transform: uppercase; margin: 16px 0 8px; }
                    .sidebar p { margin: 0 0 8px; font-size: 13px; line-height: 1.5; }
                    h2 { margin: 0 0 10px; color: #1d4ed8; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; }
                    .section { margin-bottom: 18px; }
                    ul { margin: 0; padding-left: 20px; }
                    li { margin: 6px 0; font-size: 14px; line-height: 1.45; }
                    .skills { display: flex; flex-wrap: wrap; gap: 6px; }
                    .tag { padding: 4px 8px; border-radius: 999px; background: #1f2937; color: #dbeafe; font-size: 11px; }
                  </style>
                </head>
                <body>
                  <div class="wrap">
                    <aside class="sidebar">
                      <div class="name">%s</div>
                      <div class="title">%s</div>
                      <div class="label">Contact</div>
                      <p>%s</p>
                      <p>%s</p>
                      <div class="label">Skills</div>
                      <div class="skills">%s</div>
                    </aside>
                    <main class="main">
                      <section class="section">
                        <h2>Professional Summary</h2>
                        <p>%s</p>
                      </section>
                      <section class="section">
                        <h2>Experience</h2>
                        <p><strong>%s</strong></p>
                        <ul>%s</ul>
                      </section>
                      <section class="section">
                        <h2>Education</h2>
                        <p>%s</p>
                      </section>
                      <section class="section">
                        <h2>ATS Notes</h2>
                        <p>%s</p>
                      </section>
                    </main>
                  </div>
                </body>
                </html>
                """.formatted(
                html(content.name()),
                html(content.title()),
                html(content.email()),
                html(content.phone()),
                htmlTags(content.skills(), "tag"),
                html(content.summary()),
                html(content.experienceHeader()),
                htmlListItems(content.experienceBullets()),
                html(content.educationLine()),
                html(content.optimizationNotes())
        );
    }

    private String minimalCleanTemplate(GeneratedResumeContent content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { margin: 0; padding: 34px; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
                    .name { font-size: 28px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 4px; }
                    .title { font-size: 14px; margin-bottom: 8px; color: #374151; }
                    .contact { font-size: 13px; color: #4b5563; margin-bottom: 18px; }
                    hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
                    h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 8px; }
                    p { margin: 0 0 8px; line-height: 1.7; font-size: 14px; }
                    ul { margin: 0; padding-left: 18px; }
                    li { margin: 5px 0; font-size: 14px; line-height: 1.6; }
                  </style>
                </head>
                <body>
                  <div class="name">%s</div>
                  <div class="title">%s</div>
                  <div class="contact">%s | %s</div>
                  <hr />
                  <h2>Summary</h2>
                  <p>%s</p>
                  <hr />
                  <h2>Skills</h2>
                  <ul>%s</ul>
                  <hr />
                  <h2>Experience</h2>
                  <p><strong>%s</strong></p>
                  <ul>%s</ul>
                  <hr />
                  <h2>Education</h2>
                  <p>%s</p>
                  <hr />
                  <h2>ATS Notes</h2>
                  <p>%s</p>
                </body>
                </html>
                """.formatted(
                html(content.name()),
                html(content.title()),
                html(content.email()),
                html(content.phone()),
                html(content.summary()),
                htmlListItems(content.skills()),
                html(content.experienceHeader()),
                htmlListItems(content.experienceBullets()),
                html(content.educationLine()),
                html(content.optimizationNotes())
        );
    }

    private String executiveTemplate(GeneratedResumeContent content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { margin: 0; font-family: 'Trebuchet MS', sans-serif; color: #111827; background: #f8fafc; }
                    .header { background: #0f172a; color: #f8fafc; padding: 28px; display: flex; align-items: center; gap: 18px; }
                    .photo { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 10px; letter-spacing: 0.1em; color: #cbd5e1; }
                    .name { font-size: 30px; font-weight: 700; margin-bottom: 3px; }
                    .title { font-size: 14px; color: #cbd5e1; }
                    .body { padding: 28px; background: #ffffff; }
                    h2 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1e293b; border-left: 4px solid #334155; padding-left: 8px; }
                    .contact { margin-bottom: 16px; font-size: 13px; color: #334155; }
                    .section { margin-bottom: 18px; }
                    p { margin: 0 0 8px; line-height: 1.55; font-size: 14px; }
                    ul { margin: 0; padding-left: 20px; }
                    li { margin: 6px 0; line-height: 1.45; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <header class="header">
                    <div class="photo">PHOTO</div>
                    <div>
                      <div class="name">%s</div>
                      <div class="title">%s</div>
                    </div>
                  </header>
                  <main class="body">
                    <div class="contact">%s | %s</div>
                    <section class="section">
                      <h2>Executive Summary</h2>
                      <p>%s</p>
                    </section>
                    <section class="section">
                      <h2>Core Competencies</h2>
                      <ul>%s</ul>
                    </section>
                    <section class="section">
                      <h2>Professional Experience</h2>
                      <p><strong>%s</strong></p>
                      <ul>%s</ul>
                    </section>
                    <section class="section">
                      <h2>Education</h2>
                      <p>%s</p>
                    </section>
                    <section class="section">
                      <h2>ATS Notes</h2>
                      <p>%s</p>
                    </section>
                  </main>
                </body>
                </html>
                """.formatted(
                html(content.name()),
                html(content.title()),
                html(content.email()),
                html(content.phone()),
                html(content.summary()),
                htmlListItems(content.skills()),
                html(content.experienceHeader()),
                htmlListItems(content.experienceBullets()),
                html(content.educationLine()),
                html(content.optimizationNotes())
        );
    }

    private String creativeAccentTemplate(GeneratedResumeContent content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { margin: 0; padding: 30px; font-family: 'Segoe UI', sans-serif; background: #fff7fb; color: #1f2937; }
                    .name { font-size: 30px; font-weight: 700; margin-bottom: 4px; color: #9f1239; }
                    .title { font-size: 14px; color: #be123c; margin-bottom: 10px; }
                    .contact { font-size: 13px; color: #4b5563; margin-bottom: 20px; }
                    .section { border-left: 5px solid #e11d48; background: #ffffff; padding: 10px 12px; margin-bottom: 12px; border-radius: 6px; }
                    h2 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.09em; color: #9f1239; }
                    p { margin: 0 0 6px; font-size: 14px; line-height: 1.55; }
                    ul { margin: 0; padding-left: 20px; }
                    li { margin: 5px 0; font-size: 14px; line-height: 1.45; }
                  </style>
                </head>
                <body>
                  <div class="name">%s</div>
                  <div class="title">%s</div>
                  <div class="contact">%s | %s</div>
                  <section class="section">
                    <h2>Professional Summary</h2>
                    <p>%s</p>
                  </section>
                  <section class="section">
                    <h2>Skills</h2>
                    <ul>%s</ul>
                  </section>
                  <section class="section">
                    <h2>Experience</h2>
                    <p><strong>%s</strong></p>
                    <ul>%s</ul>
                  </section>
                  <section class="section">
                    <h2>Education</h2>
                    <p>%s</p>
                  </section>
                  <section class="section">
                    <h2>ATS Notes</h2>
                    <p>%s</p>
                  </section>
                </body>
                </html>
                """.formatted(
                html(content.name()),
                html(content.title()),
                html(content.email()),
                html(content.phone()),
                html(content.summary()),
                htmlListItems(content.skills()),
                html(content.experienceHeader()),
                htmlListItems(content.experienceBullets()),
                html(content.educationLine()),
                html(content.optimizationNotes())
        );
    }

    private String techDeveloperTemplate(GeneratedResumeContent content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { margin: 0; background: #020617; color: #e2e8f0; font-family: 'Courier New', monospace; }
                    .header { background: #0f172a; padding: 20px 24px; border-bottom: 1px solid #334155; }
                    .name { font-size: 28px; font-weight: 700; color: #22d3ee; margin-bottom: 4px; }
                    .title { font-size: 13px; color: #94a3b8; }
                    .contact { font-size: 12px; color: #cbd5e1; margin-top: 8px; }
                    .container { padding: 22px 24px 28px; }
                    .section { margin-bottom: 16px; }
                    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #22d3ee; margin: 0 0 8px; }
                    p { margin: 0 0 8px; font-size: 13px; line-height: 1.55; }
                    ul { margin: 0; padding-left: 20px; }
                    li { margin: 5px 0; font-size: 13px; line-height: 1.45; }
                    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
                    .tag { border: 1px solid #0891b2; color: #67e8f9; background: #082f49; border-radius: 6px; padding: 2px 6px; font-size: 11px; }
                  </style>
                </head>
                <body>
                  <header class="header">
                    <div class="name">%s</div>
                    <div class="title">%s</div>
                    <div class="contact">%s | %s</div>
                  </header>
                  <div class="container">
                    <section class="section">
                      <h2>// summary</h2>
                      <p>%s</p>
                    </section>
                    <section class="section">
                      <h2>// skill_tags</h2>
                      <div class="tags">%s</div>
                    </section>
                    <section class="section">
                      <h2>// experience</h2>
                      <p><strong>%s</strong></p>
                      <ul>%s</ul>
                    </section>
                    <section class="section">
                      <h2>// education</h2>
                      <p>%s</p>
                    </section>
                    <section class="section">
                      <h2>// ats_notes</h2>
                      <p>%s</p>
                    </section>
                  </div>
                </body>
                </html>
                """.formatted(
                html(content.name()),
                html(content.title()),
                html(content.email()),
                html(content.phone()),
                html(content.summary()),
                htmlTags(content.skills(), "tag"),
                html(content.experienceHeader()),
                htmlListItems(content.experienceBullets()),
                html(content.educationLine()),
                html(content.optimizationNotes())
        );
    }

    private String htmlListItems(List<String> values) {
        StringBuilder builder = new StringBuilder();
        for (String value : values) {
            builder.append("<li>").append(html(value)).append("</li>");
        }
        return builder.toString();
    }

    private String htmlTags(List<String> values, String className) {
        StringBuilder builder = new StringBuilder();
        for (String value : values) {
            builder.append("<span class=\"")
                    .append(className)
                    .append("\">")
                    .append(html(value))
                    .append("</span>");
        }
        return builder.toString();
    }

    private String html(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
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
                matched.subList(0, Math.min(20, matched.size())),
                count,
                keywords.size()
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

    private int calculateAtsScore(String normalizedResume, String rawResume, KeywordResult keywordResult) {
        double keywordScore = keywordResult.totalKeywords == 0
                ? 70.0
                : (keywordResult.matchedCount * 100.0) / keywordResult.totalKeywords;

        boolean hasSkillsHeading = normalizedResume.contains("skills")
                || normalizedResume.contains("technical skills")
                || normalizedResume.contains("tech skills");
        double skillsScore = hasSkillsHeading ? 100.0 : 0.0;

        boolean hasQuantifiedExperience = hasQuantifiedBullet(rawResume);
        double quantifiedScore = hasQuantifiedExperience ? 100.0 : 0.0;

        int contactFound = 0;
        if (Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}").matcher(rawResume).find()) {
            contactFound++;
        }
        if (Pattern.compile("(?:\\+?\\d{1,3}[\\s-]?)?(?:\\(?\\d{3}\\)?[\\s-]?)?\\d{3}[\\s-]?\\d{4}").matcher(rawResume).find()) {
            contactFound++;
        }
        if (normalizedResume.contains("linkedin")) {
            contactFound++;
        }
        double contactScore = (contactFound / 3.0) * 100.0;

        int sectionsFound = 0;
        if (normalizedResume.contains("summary")
                || normalizedResume.contains("professional profile")
                || normalizedResume.contains("objective")) {
            sectionsFound++;
        }
        if (hasSkillsHeading) sectionsFound++;
        if (normalizedResume.contains("experience") || normalizedResume.contains("work history")) sectionsFound++;
        if (normalizedResume.contains("education")) sectionsFound++;
        double completenessScore = (sectionsFound / 4.0) * 100.0;

        double totalScore = (keywordScore * 0.40)
                + (skillsScore * 0.15)
                + (quantifiedScore * 0.20)
                + (contactScore * 0.10)
                + (completenessScore * 0.15);

        return clamp((int) Math.round(totalScore));
    }

    private boolean hasQuantifiedBullet(String rawResume) {
        if (rawResume == null || rawResume.isBlank()) return false;
        String[] lines = rawResume.split("\\R");
        Pattern numberPattern = Pattern.compile("\\b\\d+%?\\b");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            boolean isBullet = trimmed.startsWith("-")
                    || trimmed.startsWith("*")
                    || trimmed.matches("^\\d+[\\.)]\\s+.*");
            if (isBullet && numberPattern.matcher(trimmed).find()) {
                return true;
            }
        }
        return numberPattern.matcher(rawResume).find();
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

    private record GeneratedResumeContent(
            String name,
            String title,
            String email,
            String phone,
            String summary,
            List<String> skills,
            List<String> experienceBullets,
            String experienceHeader,
            String educationLine,
            String optimizationNotes
    ) {
    }

    private record KeywordResult(
            SectionFeedback feedback,
            List<String> missingKeywords,
            List<String> matchedKeywords,
            int matchedCount,
            int totalKeywords
    ) {
    }
}
