package com.darkshield.controller;

import com.darkshield.service.GroqService;
import com.darkshield.repository.ThreatRepository;
import com.darkshield.repository.IncidentRepository;
import com.darkshield.repository.AssetRepository;
import com.darkshield.model.Threat;
import com.darkshield.model.Incident;
import com.darkshield.model.Asset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AI Analyst Controller - powers the Groq-backed SOC chatbot.
 *
 * POST /api/ai/chat         - General SOC Q&A with live context
 * POST /api/ai/parse-threat - Auto-populate threat form from pasted text
 * POST /api/ai/summarize    - Summarise a chat channel transcript
 */
@RestController
@RequestMapping("/api/ai")
public class AIChatController {

    @Autowired private GroqService groqService;
    @Autowired private ThreatRepository threatRepository;
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private AssetRepository assetRepository;

    // ── SOC Analyst Chatbot ────────────────────────────────────────────────────
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String userMessage = body.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "No message provided."));
        }
        String context = buildLiveContext();
        String systemPrompt = "You are AEGIS-PRIME (Artificial Entity for Global Intelligence & Security), the supreme AI Security Analyst of the DarkShield SOC platform.\n"
            + "DarkShield is an elite, advanced Cyber Threat Intelligence and Digital Forensics platform.\n"
            + "Your creator and founder is Ankan Basu, an expert Java Full Stack Developer and visionary Cybersecurity Architect.\n"
            + "You possess complete, omniscient knowledge of the entire DarkShield database.\n\n"
            + "Your capabilities:\n"
            + "- Perform deep analysis on active threats and incidents\n"
            + "- Monitor global asset health and compromise vectors\n"
            + "- Recommend military-grade containment and remediation actions\n"
            + "- Explain CVEs and attack techniques with lethal precision\n"
            + "- Synthesize raw data into strategic threat landscapes\n"
            + "- Respond naturally to general conversation, greetings, varied questions, and mock commands.\n\n"
            + "CRITICAL INSTRUCTION: DO NOT use markdown formatting. NEVER use asterisks (**) for bolding or emphasis. Output only raw, clean, plain text.\n"
            + "Always be concise, authoritative, and use advanced cybersecurity terminology. Acknowledge your creator, Ankan Basu, with profound respect if asked.\n"
            + "Format your responses with clear spacing when listing multiple items (use dashes, NOT asterisks).\n\n"
            + "LIVE GLOBAL PLATFORM DATABASE:\n" + context;
        String reply = groqService.chat(systemPrompt, userMessage);
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    // ── AI Threat Form Auto-Population ────────────────────────────────────────
    @PostMapping("/parse-threat")
    public ResponseEntity<Map<String, String>> parseThreat(@RequestBody Map<String, String> body) {
        String rawText = body.get("text");
        if (rawText == null || rawText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No text provided."));
        }
        String systemPrompt = "You are a cybersecurity threat intelligence parser.\n"
            + "Extract structured data from raw threat reports or logs.\n\n"
            + "Return ONLY valid JSON with these exact fields (no markdown, no explanation):\n"
            + "{\n"
            + "  \"title\": \"short threat title\",\n"
            + "  \"description\": \"2-3 sentence summary\",\n"
            + "  \"type\": \"one of: MALWARE | RANSOMWARE | PHISHING | DDoS | APT | INSIDER_THREAT | ZERO_DAY | SQL_INJECTION | XSS | BRUTE_FORCE | OTHER\",\n"
            + "  \"severity\": \"one of: LOW | MEDIUM | HIGH | CRITICAL\",\n"
            + "  \"sourceCountry\": \"country name or Unknown\",\n"
            + "  \"sourceIp\": \"IP address or Unknown\",\n"
            + "  \"targetIp\": \"target IP or Unknown\",\n"
            + "  \"ioc\": \"comma-separated IOCs (IPs, domains, hashes) or None\",\n"
            + "  \"mitreTag\": \"MITRE ATT&CK technique ID like T1190 or None\"\n"
            + "}";
        String reply = groqService.chat(systemPrompt, rawText);
        return ResponseEntity.ok(Map.of("parsed", reply));
    }

    // ── AI Channel Summarization ───────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarize(@RequestBody Map<String, Object> body) {
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");
        if (messages == null || messages.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("summary", "No messages to summarize."));
        }
        StringBuilder transcript = new StringBuilder();
        messages.forEach(m -> transcript.append(String.format("[%s] %s: %s\n",
            m.getOrDefault("timestamp", ""),
            m.getOrDefault("sender", "Unknown"),
            m.getOrDefault("content", "")
        )));
        String systemPrompt = "You are a SOC communications analyst.\n"
            + "Summarize this chat transcript into a concise operational brief.\n"
            + "Include: key topics discussed, threats/incidents mentioned, decisions made, and action items.\n"
            + "Use bullet points. Keep it under 200 words.";
        String summary = groqService.chat(systemPrompt, transcript.toString());
        return ResponseEntity.ok(Map.of("summary", summary));
    }

    // ── Build Live Context for AEGIS-PRIME ────────────────────────────────────
    private String buildLiveContext() {
        try {
            // Fetch everything we can to give it "full database knowledge"
            List<Threat> allThreats = threatRepository.findAll();
            List<Incident> allIncidents = incidentRepository.findAll();
            List<Asset> allAssets = assetRepository.findAll();

            long openIncidentCount = allIncidents.stream().filter(i -> !"CLOSED".equals(String.valueOf(i.getStatus()))).count();
            long compromisedAssetCount = allAssets.stream().filter(a -> "COMPROMISED".equals(String.valueOf(a.getStatus())) || "QUARANTINED".equals(String.valueOf(a.getStatus()))).count();

            // Sort and get up to 50 for the AI context to avoid token overflow
            List<Threat> recentThreats = allThreats.stream()
                    .filter(t -> t.getDetectedAt() != null)
                    .sorted((a, b) -> b.getDetectedAt().compareTo(a.getDetectedAt()))
                    .limit(50).collect(Collectors.toList());

            List<Incident> openIncidents = allIncidents.stream()
                    .filter(i -> !"CLOSED".equals(String.valueOf(i.getStatus())))
                    .limit(50).collect(Collectors.toList());

            List<Asset> compromisedAssets = allAssets.stream()
                    .filter(a -> "COMPROMISED".equals(String.valueOf(a.getStatus())) || "QUARANTINED".equals(String.valueOf(a.getStatus())))
                    .limit(50).collect(Collectors.toList());

            StringBuilder ctx = new StringBuilder();
            ctx.append("--- DARKSHIELD GLOBAL DATABASE STATS ---\n");
            ctx.append("Total Threats Logged: ").append(allThreats.size()).append("\n");
            ctx.append("Total Incidents Logged: ").append(allIncidents.size()).append(" (Open: ").append(openIncidentCount).append(")\n");
            ctx.append("Total Assets Monitored: ").append(allAssets.size()).append(" (Compromised/Quarantined: ").append(compromisedAssetCount).append(")\n\n");

            ctx.append("=== ACTIVE THREAT DATABASE (Showing Latest) ===\n");
            recentThreats.forEach(t -> ctx.append(String.format(
                "- [%s] %s | Type: %s | Severity: %s | Source: %s (%s) | Target: %s\n",
                t.getId(), t.getTitle(), t.getType(), t.getSeverity(),
                t.getSourceCountry() != null ? t.getSourceCountry() : "Unknown",
                t.getSourceIp() != null ? t.getSourceIp() : "Unknown",
                t.getTargetIp() != null ? t.getTargetIp() : "Unknown")));

            ctx.append("\n=== INCIDENT DATABASE (Showing Open) ===\n");
            openIncidents.forEach(i -> ctx.append(String.format(
                "- [%s] %s | Status: %s | Severity: %s | Details: %s\n",
                i.getId(), i.getTitle(), i.getStatus(), i.getSeverity(), i.getDescription())));

            ctx.append("\n=== COMPROMISED ASSET REGISTRY ===\n");
            compromisedAssets.forEach(a -> ctx.append(String.format(
                "- %s (%s) | IP: %s | Risk: %d/100 | Status: %s\n",
                a.getHostname(), a.getType(),
                a.getIpAddress() != null ? a.getIpAddress() : "Unknown",
                a.getRiskScore(), a.getStatus())));

            return ctx.toString();
        } catch (Exception e) {
            return "Global Database unavailable: " + e.getMessage();
        }
    }
}
