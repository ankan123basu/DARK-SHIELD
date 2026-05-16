package com.darkshield.controller;

import com.darkshield.model.ChatMessage;
import com.darkshield.repository.ChatMessageRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * WebSocket Chat Controller.
 * Routes messages to correct channel topics AND persists every message to MongoDB.
 *
 * Client sends TO:  /app/chat.send
 * Server relays to: /topic/chat/{channel}  OR  /topic/chat/dm/{recipient}
 * History API:      GET /api/chat/history/{channel}
 *                   GET /api/chat/history/dm/{peer}
 */
@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          ChatMessageRepository chatMessageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
    }

    // ── WebSocket: Send Message ─────────────────────────────────────────────
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message, Principal principal) {
        // Stamp the server-side timestamp
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        message.setTimestamp(now);
        message.setCreatedAt(LocalDateTime.now());
        message.setType(ChatMessage.MessageType.CHAT);

        // Persist to MongoDB ← this is what was missing before
        chatMessageRepository.save(message);

        // Route based on channel
        if ("dm".equals(message.getChannel()) && message.getRecipient() != null) {
            String dmTopic  = "/topic/chat/dm/" + message.getRecipient();
            String selfTopic = "/topic/chat/dm/" + (principal != null ? principal.getName() : message.getSender());
            messagingTemplate.convertAndSend(dmTopic, message);
            if (!message.getRecipient().equals(message.getSender())) {
                messagingTemplate.convertAndSend(selfTopic, message);
            }
        } else {
            String channel = message.getChannel() != null ? message.getChannel() : "all";
            messagingTemplate.convertAndSend("/topic/chat/" + channel, message);
        }
    }

    // ── WebSocket: Join Announcement ────────────────────────────────────────
    @MessageMapping("/chat.join")
    public void userJoined(@Payload ChatMessage message) {
        message.setType(ChatMessage.MessageType.JOIN);
        message.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        message.setCreatedAt(LocalDateTime.now());
        message.setContent(message.getSender() + " joined the channel");
        // Join events are NOT persisted — they're ephemeral system messages
        messagingTemplate.convertAndSend(
            "/topic/chat/" + (message.getChannel() != null ? message.getChannel() : "all"),
            message
        );
    }

    // ── REST: Load Channel History ──────────────────────────────────────────
    @GetMapping("/api/chat/history/{channel}")
    @ResponseBody
    public List<ChatMessage> getChannelHistory(@PathVariable String channel) {
        return chatMessageRepository.findTop100ByChannelOrderByCreatedAtAsc(channel);
    }

    // ── REST: Load DM History ───────────────────────────────────────────────
    @GetMapping("/api/chat/history/dm/{peer}")
    @ResponseBody
    public List<ChatMessage> getDmHistory(
            @PathVariable String peer,
            @AuthenticationPrincipal UserDetails userDetails) {
        String me = userDetails.getUsername();
        return chatMessageRepository.findDmHistory(me, peer);
    }
}
