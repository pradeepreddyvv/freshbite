package com.freshbite.backend.service;

import com.freshbite.backend.domain.DishAtRestaurant;
import com.freshbite.backend.domain.Review;
import com.freshbite.backend.dto.ChatRequest;
import com.freshbite.backend.dto.ChatResponse;
import com.freshbite.backend.dto.LlmChatRequest;
import com.freshbite.backend.dto.TimeWindow;
import com.freshbite.backend.repository.DishAtRestaurantRepository;
import com.freshbite.backend.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class LlmClient {
  private static final Logger log = LoggerFactory.getLogger(LlmClient.class);
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
    long start = System.currentTimeMillis();
    TimeWindow tw = TimeWindow.from(request.window(), TimeWindow.H24);
    String window = tw.getValue();

    log.info("LlmClient.ask dishId={} question=\"{}\" window={}",
      request.dishAtRestaurantId(),
      request.question().length() > 50 ? request.question().substring(0, 50) + "..." : request.question(),
      window);

    // Fetch the dish info
    DishAtRestaurant dar = dishAtRestaurantRepository.findById(request.dishAtRestaurantId())
      .orElseThrow(() -> {
        log.warn("LlmClient.ask dish NOT_FOUND id={}", request.dishAtRestaurantId());
        return new NoSuchElementException("Dish not found: " + request.dishAtRestaurantId());
      });

    String dishName = dar.getDish().getName() + " at " + dar.getRestaurant().getName();

    // Fetch recent reviews within the time window
    Instant cutoff = tw.cutoff(Instant.now());
    List<Review> reviews = reviewRepository
      .findByDishAtRestaurantIdAndCreatedAtAfterOrderByCreatedAtDesc(request.dishAtRestaurantId(), cutoff);

    log.info("LlmClient.ask fetched reviewCount={} for dish=\"{}\" cutoff={}", reviews.size(), dishName, cutoff);

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

    log.info("LlmClient.ask calling FastAPI with {} reviews", reviewData.size());

    try {
      ChatResponse response = llmWebClient.post()
        .uri("/chat")
        .bodyValue(llmRequest)
        .retrieve()
        .bodyToMono(ChatResponse.class)
        .block();

      log.info("LlmClient.ask completed reviewIdsUsed={} duration={}ms",
        response != null ? response.reviewIdsUsed().size() : 0,
        System.currentTimeMillis() - start);

      return response;
    } catch (Exception e) {
      log.error("LlmClient.ask FastAPI call FAILED error={} duration={}ms",
        e.getMessage(), System.currentTimeMillis() - start, e);
      throw e;
    }
  }
}
