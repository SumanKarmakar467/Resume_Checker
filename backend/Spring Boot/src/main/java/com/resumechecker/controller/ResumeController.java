package com.resumechecker.controller;

import com.resumechecker.model.GenerateResumeRequest;
import com.resumechecker.model.GenerateResumeResponse;
import com.resumechecker.model.ResumeAnalysisResponse;
import com.resumechecker.model.Suggestion;
import com.resumechecker.model.SuggestionsRequest;
import com.resumechecker.model.SuggestionsResponse;
import com.resumechecker.service.GeminiService;
import com.resumechecker.service.ResumeAnalysisService;
import com.resumechecker.service.ResumeParser;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ResumeController {
    private final ResumeAnalysisService analysisService;
    private final ResumeParser resumeParser;
    private final GeminiService geminiService;

    public ResumeController(ResumeAnalysisService analysisService, ResumeParser resumeParser, GeminiService geminiService) {
        this.analysisService = analysisService;
        this.resumeParser = resumeParser;
        this.geminiService = geminiService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeAnalysisResponse analyze(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "jobDescription", required = false, defaultValue = "") String jobDescription
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload a PDF, DOCX, or TXT resume file.");
        }

        String resumeText = resumeParser.parse(file);
        return analysisService.analyzeResume(resumeText, jobDescription);
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
