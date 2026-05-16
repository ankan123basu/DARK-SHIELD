package com.darkshield.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Groq AI Service - calls the Groq REST API (Llama 3 70B).
 * Used for the AI SOC Analyst chatbot and threat form auto-population.
 *
 * API Key is read from the GROQ_API_KEY environment variable
 * via application.properties: groq.api.key=${GROQ_API_KEY}
 */
@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Send a prompt to Groq and get a plain text response.
     * @param systemPrompt The system role / context prompt
     * @param userMessage  The user's question
     * @return AI response text
     */
    @SuppressWarnings("unchecked")
    public String chat(String systemPrompt, String userMessage) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user",   "content", userMessage)
                ),
                "max_tokens", 1024,
                "temperature", 0.7
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message =
                        (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return "AEGIS is temporarily offline. Try again shortly.";
        } catch (Exception e) {
            return "Error contacting Groq API: " + e.getMessage();
        }
    }
}
