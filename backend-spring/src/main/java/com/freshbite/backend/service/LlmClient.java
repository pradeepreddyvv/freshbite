package com.freshbite.backend.service;

import com.freshbite.backend.domain.DishAtRestaurant;
import com.freshbite.backend.domain.Review;
import com.freshbite.backend.dto.ChatRequest;
import com.freshbite.backend.dto.ChatResponse;
import com.freshbite.backend.dto.LlmChatRequest;
import com.freshbite.backend.dto.TimeWindow;
import com.freshbite.backend.repository.DishAtRestaurantRepository;
import com.freshbite.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class LlmClient {
  private final WebClient llmWebClient;
  private final DishAtRestaurantRepository dishAtRestaurantRepository;
  private final ReviewRepository reviewRepository;

  public LlmClient(
    WebClient llmWebClient,
    DishAtRestaurantRepository dishAtRestaurantRepository,
    ReviewRepository reviewRepository
  ) {
    this.llmWebClient = llmWebClient;
    this.dishAtRestaurantRepository = dishAtRestaurantRepository;
    this.reviewRepository = reviewRepository;
  }

  public ChatResponse ask(ChatRequest request) {
    TimeWindow tw = TimeWindow.from(request.window(), TimeWindow.H24);
    String window = tw.getValue();

    // Fetch the dish info
    DishAtRestaurant dar = dishAtRestaurantRepository.findById(request.dishAtRestaurantId())
      .orElseThrow(() -> new NoSuchElementException("Dish not found: " + request.dishAtRestaurantId()));

    String dishName = dar.getDish().getName() + " at " + dar.getRestaurant().getName();

    // Fetch recent reviews within the time window
    Instant cutoff = tw.cutoff(Instant.now());
    List<Review> reviews = reviewRepository
      .findByDishAtRestaurantIdAndCreatedAtAfterOrderByCreatedAtDesc(request.dishAtRestaurantId(), cutoff);

    // Convert to LLM-friendly format
    List<LlmChatRequest.LlmReviewData> reviewData = reviews.stream()
      .map(r -> new LlmChatRequest.LlmReviewData(
        r.getId(),
        r.getRating(),
        r.getText(),
        r.getCreatedAt().toString()
      ))
      .toList();

    LlmChatRequest llmRequest = new LlmChatRequest(
      request.dishAtRestaurantId(),
      request.question(),
      window,
      dishName,
      reviewData
    );

    return llmWebClient.post()
      .uri("/chat")
      .bodyValue(llmRequest)
      .retrieve()
      .bodyToMono(ChatResponse.class)
      .block();
  }
}
