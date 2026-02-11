package com.freshbite.backend.controller;

import com.freshbite.backend.dto.ChatRequest;
import com.freshbite.backend.dto.ChatResponse;
import com.freshbite.backend.service.LlmClient;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatController {
  private static final Logger log = LoggerFactory.getLogger(ChatController.class);
  private final LlmClient llmClient;

  public ChatController(LlmClient llmClient) {
    this.llmClient = llmClient;
  }

  @PostMapping("/chat")
  public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
    log.info("POST /api/chat dishId={} question=\"{}\" window={}",
      request.dishAtRestaurantId(),
      request.question().length() > 50 ? request.question().substring(0, 50) + "..." : request.question(),
      request.window());
    long start = System.currentTimeMillis();
    try {
      ChatResponse response = llmClient.ask(request);
      log.info("POST /api/chat completed dishId={} reviewsUsed={} duration={}ms",
        request.dishAtRestaurantId(), response.reviewIdsUsed().size(), System.currentTimeMillis() - start);
      return response;
    } catch (Exception e) {
      log.error("POST /api/chat FAILED dishId={} error={} duration={}ms",
        request.dishAtRestaurantId(), e.getMessage(), System.currentTimeMillis() - start, e);
      throw e;
    }
  }
}
