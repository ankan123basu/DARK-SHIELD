package com.darkshield.controller;

import com.darkshield.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * WebSocket Chat Controller.
 * Routes messages to the correct channel topic based on the message's channel field.
 *
 * Client sends TO:  /app/chat.send
 * Server relays to: /topic/chat/{channel}  OR  /topic/chat/dm/{recipient}
 */
@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message, Principal principal) {
        // Stamp the server-side timestamp
        message.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        // Route based on channel
        if ("dm".equals(message.getChannel()) && message.getRecipient() != null) {
            // Direct message — send to recipient's personal topic AND sender's topic
            String dmTopic = "/topic/chat/dm/" + message.getRecipient();
            String selfTopic = "/topic/chat/dm/" + (principal != null ? principal.getName() : message.getSender());
            messagingTemplate.convertAndSend(dmTopic, message);
            if (!message.getRecipient().equals(message.getSender())) {
                messagingTemplate.convertAndSend(selfTopic, message);
            }
        } else {
            // Channel broadcast — all, hunters, analysts, admins
            String channel = message.getChannel() != null ? message.getChannel() : "all";
            messagingTemplate.convertAndSend("/topic/chat/" + channel, message);
        }
    }

    @MessageMapping("/chat.join")
    public void userJoined(@Payload ChatMessage message) {
        message.setType(ChatMessage.MessageType.JOIN);
        message.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        message.setContent(message.getSender() + " joined the channel");
        messagingTemplate.convertAndSend("/topic/chat/" + (message.getChannel() != null ? message.getChannel() : "all"), message);
    }
}
