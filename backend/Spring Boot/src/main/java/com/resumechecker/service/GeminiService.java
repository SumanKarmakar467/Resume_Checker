// Purpose: Call Gemini API and return structured ATS rewrite suggestions.
package com.resumechecker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumechecker.model.Suggestion;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class GeminiService {
    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String GEMINI_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s";
    private static final MediaType JSON_MEDIA_TYPE = MediaType.get("application/json; charset=utf-8");

    private final ObjectMapper objectMapper;
    private final OkHttpClient httpClient;
    private final String apiKey;

    public GeminiService(
            ObjectMapper objectMapper,
            @Value("${GEMINI_API_KEY:}") String apiKey
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(20))
                .writeTimeout(Duration.ofSeconds(20))
                .build();
    }

    /**
     * Generate rewrite suggestions using Gemini against resume and job description text.
     *
     * @param resumeText extracted resume text
     * @param jobDescription target job description
     * @return up to 5 structured suggestions, or empty list on failure
     */
    public List<Suggestion> getSuggestions(String resumeText, String jobDescription) {
        try {
            if (apiKey.isBlank()) {
                log.warn("GEMINI_API_KEY is missing; returning empty suggestions.");
                return List.of();
            }

            String prompt = buildPrompt(resumeText, jobDescription);
            String rawResponse = callGeminiApi(prompt);
            if (rawResponse == null || rawResponse.isBlank()) {
                return List.of();
            }

            String cleaned = stripMarkdownFences(rawResponse);
            SuggestionsEnvelope envelope = objectMapper.readValue(cleaned, SuggestionsEnvelope.class);
            if (envelope == null || envelope.suggestions == null) {
                return List.of();
            }

            return envelope.suggestions.stream().limit(5).toList();
        } catch (Exception ex) {
            log.error("Gemini suggestions failed. Returning empty list.", ex);
            return List.of();
        }
    }

    private String buildPrompt(String resumeText, String jobDescription) {
        String safeResume = resumeText == null ? "" : resumeText;
        String safeJobDescription = jobDescription == null ? "" : jobDescription;

        return """
                You are an expert ATS resume consultant.
                Resume text: %s
                Job description: %s
                Analyze the resume against the job description. Return ONLY a valid JSON object with no extra text or markdown:
                { suggestions: [{ weak_line, improved_line, reason }] }
                Return exactly 5 suggestions.
                """.formatted(safeResume, safeJobDescription);
    }

    private String callGeminiApi(String prompt) throws Exception {
        String url = GEMINI_URL_TEMPLATE.formatted(apiKey);
        String requestJson = objectMapper.writeValueAsString(
                new GeminiGenerateRequest(
                        List.of(new GeminiContent(List.of(new GeminiPart(prompt)))),
                        new GeminiGenerationConfig("application/json")
                )
        );

        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(requestJson, JSON_MEDIA_TYPE))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new IllegalStateException("Gemini API error: " + response.code() + " " + errorBody);
            }

            String payload = response.body() != null ? response.body().string() : "";
            JsonNode root = objectMapper.readTree(payload);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            return textNode.isMissingNode() ? "" : textNode.asText("");
        }
    }

    private String stripMarkdownFences(String raw) {
        String cleaned = raw == null ? "" : raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private record SuggestionsEnvelope(List<Suggestion> suggestions) {
    }

    private record GeminiGenerateRequest(List<GeminiContent> contents, GeminiGenerationConfig generationConfig) {
    }

    private record GeminiContent(List<GeminiPart> parts) {
    }

    private record GeminiPart(String text) {
    }

    private record GeminiGenerationConfig(String responseMimeType) {
    }
}
