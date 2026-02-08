package com.freshbite.backend.dto;

import java.util.List;

/**
 * Internal DTO sent to the FastAPI LLM service.
 * Includes review data so the LLM can analyze it.
 */
public record LlmChatRequest(
  String dishAtRestaurantId,
  String question,
  String window,
  String dishName,
  List<LlmReviewData> reviews
) {
  public record LlmReviewData(
    String id,
    int rating,
    String text,
    String createdAt
  ) {}
}
