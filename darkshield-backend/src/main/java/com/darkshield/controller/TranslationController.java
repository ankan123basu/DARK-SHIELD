package com.darkshield.controller;

import com.darkshield.service.GroqService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Translation Controller - uses Groq AI for real-time message translation.
 * POST /api/translate - translates text to target language
 */
@RestController
@RequestMapping("/api/translate")
public class TranslationController {

    @Autowired
    private GroqService groqService;

    @PostMapping
    public ResponseEntity<Map<String, String>> translate(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        String targetLang = body.get("targetLang");

        if (text == null || text.isBlank() || targetLang == null) {
            return ResponseEntity.badRequest().body(Map.of("translation", text != null ? text : ""));
        }

        if ("Original".equals(targetLang) || "English".equals(targetLang)) {
            return ResponseEntity.ok(Map.of("translation", text));
        }

        String systemPrompt = "You are a professional translator. "
            + "Translate the following text to " + targetLang + ". "
            + "Return ONLY the translated text, nothing else. No quotes, no explanation. "
            + "If the text is already in " + targetLang + ", return it as-is.";

        String translation = groqService.chat(systemPrompt, text);
        return ResponseEntity.ok(Map.of("translation", translation, "lang", targetLang));
    }
}
