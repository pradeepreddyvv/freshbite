package com.freshbite.backend.controller;

import com.freshbite.backend.dto.ChatRequest;
import com.freshbite.backend.dto.ChatResponse;
import com.freshbite.backend.service.LlmClient;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatController {
  private final LlmClient llmClient;

  public ChatController(LlmClient llmClient) {
    this.llmClient = llmClient;
  }

  @PostMapping("/chat")
  public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
    return llmClient.ask(request);
  }
}
