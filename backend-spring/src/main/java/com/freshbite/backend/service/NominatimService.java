package com.freshbite.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Geocodes place names to coordinates using the free Nominatim API (OpenStreetMap).
 * <a href="https://nominatim.org/release-docs/latest/api/Search/">Nominatim docs</a>
 *
 * Usage policy: max 1 req/sec, custom User-Agent required.
 */
@Service
public class NominatimService {
  private static final Logger log = LoggerFactory.getLogger(NominatimService.class);
  private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

  private final WebClient webClient;
  private final ObjectMapper objectMapper;

  public NominatimService(ObjectMapper objectMapper) {
    this.webClient = WebClient.builder()
      .defaultHeader("User-Agent", "FreshBite/1.0 (dish-review-app)")
      .build();
    this.objectMapper = objectMapper;
  }

  public record GeoResult(String displayName, double lat, double lng) {}

  /**
   * Geocode a place name to coordinates.
   * Returns the top result, or null if nothing found.
   */
  public GeoResult geocode(String placeName) {
    try {
      String json = webClient.get()
        .uri(NOMINATIM_URL + "?q={q}&format=json&limit=1", placeName)
        .retrieve()
        .bodyToMono(String.class)
        .block();

      if (json == null || json.isBlank()) return null;

      JsonNode arr = objectMapper.readTree(json);
      if (!arr.isArray() || arr.isEmpty()) return null;

      JsonNode first = arr.get(0);
      return new GeoResult(
        first.path("display_name").asText(""),
        first.path("lat").asDouble(),
        first.path("lon").asDouble()
      );
    } catch (Exception e) {
      log.error("Nominatim geocoding failed for '{}': {}", placeName, e.getMessage());
      return null;
    }
  }

  /**
   * Geocode and return multiple results (for autocomplete / disambiguation).
   */
  public List<GeoResult> geocodeMultiple(String placeName, int limit) {
    try {
      String json = webClient.get()
        .uri(NOMINATIM_URL + "?q={q}&format=json&limit={limit}", placeName, limit)
        .retrieve()
        .bodyToMono(String.class)
        .block();

      if (json == null || json.isBlank()) return List.of();

      JsonNode arr = objectMapper.readTree(json);
      if (!arr.isArray()) return List.of();

      List<GeoResult> results = new ArrayList<>();
      for (JsonNode node : arr) {
        results.add(new GeoResult(
          node.path("display_name").asText(""),
          node.path("lat").asDouble(),
          node.path("lon").asDouble()
        ));
      }
      return results;
    } catch (Exception e) {
      log.error("Nominatim multi-geocode failed for '{}': {}", placeName, e.getMessage());
      return List.of();
    }
  }
}
