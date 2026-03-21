package com.resumechecker.controller;

import com.resumechecker.model.GenerateResumeRequest;
import com.resumechecker.model.GenerateResumeResponse;
import com.resumechecker.model.ResumeHistory;
import com.resumechecker.model.ResumeAnalysisResponse;
import com.resumechecker.model.SectionFeedback;
import com.resumechecker.model.Suggestion;
import com.resumechecker.model.SuggestionsRequest;
import com.resumechecker.model.SuggestionsResponse;
import com.resumechecker.model.User;
import com.resumechecker.repository.HistoryRepository;
import com.resumechecker.repository.UserRepository;
import com.resumechecker.service.GeminiService;
import com.resumechecker.service.ResumeAnalysisService;
import com.resumechecker.service.ResumeParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ResumeController {
    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private final ResumeAnalysisService analysisService;
    private final ResumeParser resumeParser;
    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final HistoryRepository historyRepository;

    public ResumeController(
            ResumeAnalysisService analysisService,
            ResumeParser resumeParser,
            GeminiService geminiService,
            UserRepository userRepository,
            HistoryRepository historyRepository
    ) {
        this.analysisService = analysisService;
        this.resumeParser = resumeParser;
        this.geminiService = geminiService;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeAnalysisResponse analyze(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "jobDescription", required = false, defaultValue = "") String jobDescription,
            @RequestParam(value = "jobTitle", required = false, defaultValue = "") String jobTitle,
            Authentication authentication
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload a PDF, DOCX, or TXT resume file.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size must be 5MB or less.");
        }

        String resumeText = resumeParser.parse(file);
        ResumeAnalysisResponse result = analysisService.analyzeResume(resumeText, jobDescription);
        persistHistoryIfAuthenticated(authentication, file, jobDescription, jobTitle, result);
        return result;
    }

    @PostMapping("/generate-ats")
    public GenerateResumeResponse generateAts(@RequestBody GenerateResumeRequest request) {
        String generatedResume = analysisService.generateAtsFriendlyResume(
                request.resumeText(),
                request.jobDescription()
        );
        return new GenerateResumeResponse(generatedResume);
    }

    @PostMapping("/suggestions")
    public SuggestionsResponse suggestions(@RequestBody SuggestionsRequest request) {
        List<Suggestion> suggestions = geminiService.getSuggestions(
                request.resumeText(),
                request.jobDescription()
        );
        return new SuggestionsResponse(suggestions);
    }

    private void persistHistoryIfAuthenticated(
            Authentication authentication,
            MultipartFile file,
            String jobDescription,
            String jobTitle,
            ResumeAnalysisResponse result
    ) {
        try {
            if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
                return;
            }

            Optional<User> user = userRepository.findByEmail(authentication.getName());
            if (user.isEmpty()) {
                return;
            }

            ResumeHistory history = new ResumeHistory();
            history.setUserId(user.get().getId());
            history.setResumeFileName(file.getOriginalFilename() == null ? "resume" : file.getOriginalFilename());
            history.setJobTitle(resolveJobTitle(jobTitle, jobDescription));
            history.setAtsScore(result.atsScore());
            history.setMatchedKeywords(result.matchedKeywords());
            history.setMissingKeywords(result.missingKeywords());
            history.setSections(toSectionScoreMap(result.sections()));
            history.setCreatedAt(Instant.now());
            historyRepository.save(history);
        } catch (Exception ex) {
            // History persistence should not block the analyze response.
            log.warn("Failed to persist resume history for authenticated user.", ex);
        }
    }

    private Map<String, Integer> toSectionScoreMap(List<SectionFeedback> sections) {
        Map<String, Integer> sectionMap = new LinkedHashMap<>();
        for (SectionFeedback section : sections) {
            if (section == null || section.section() == null) continue;
            sectionMap.put(section.section(), section.score());
        }
        return sectionMap;
    }

    private String resolveJobTitle(String jobTitle, String jobDescription) {
        if (jobTitle != null && !jobTitle.isBlank()) return jobTitle.trim();
        if (jobDescription == null || jobDescription.isBlank()) return "Untitled Role";

        String firstLine = jobDescription.strip().split("\\R")[0].trim();
        if (firstLine.isBlank()) return "Untitled Role";
        return firstLine.length() > 120 ? firstLine.substring(0, 120).trim() : firstLine;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleInternalError(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", ex.getMessage() == null ? "Unexpected server error." : ex.getMessage()));
    }
}
