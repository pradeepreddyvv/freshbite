package com.freshbite.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Queries the free Overpass API (OpenStreetMap) for real-world restaurants,
 * fast food, cafes near a given coordinate.
 * <p>
 * Includes every Subway, McDonald's, KFC, Burger King, local restaurants, etc.
 * No API key needed. Completely free.
 * <p>
 * <a href="https://wiki.openstreetmap.org/wiki/Overpass_API">Overpass docs</a>
 */
@Service
public class OverpassService {
  private static final Logger log = LoggerFactory.getLogger(OverpassService.class);
  private static final String OVERPASS_URL = "https://overpass-api.de/api/interpreter";

  private final WebClient webClient;
  private final ObjectMapper objectMapper;

  public OverpassService(ObjectMapper objectMapper) {
    this.webClient = WebClient.builder()
      .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
      .defaultHeader("User-Agent", "FreshBite/1.0 (dish-review-app)")
      .build();
    this.objectMapper = objectMapper;
  }

  public record OverpassRestaurant(
    long osmId,
    String name,
    String cuisine,
    String address,
    String city,
    String state,
    String country,
    String phone,
    String website,
    String openingHours,
    String type, // "restaurant", "fast_food", "cafe"
    double latitude,
    double longitude
  ) {}

  /**
   * Find restaurants near a location within a given radius.
   * <p>
   * The name filter is applied Java-side (not in Overpass query) to avoid
   * slow regex queries that can cause 504 timeouts from the Overpass API.
   *
   * @param lat       center latitude
   * @param lng       center longitude
   * @param radiusM   radius in meters (default 5000 = 5km)
   * @param nameQuery optional restaurant name filter (e.g. "McDonald's") — applied locally
   * @param limit     max results to return
   * @return list of discovered restaurants
   */
  public List<OverpassRestaurant> findNearby(double lat, double lng, int radiusM, String nameQuery, int limit) {
    // Use Locale.US to ensure dot-decimal formatting
    String latStr = String.format(java.util.Locale.US, "%.7f", lat);
    String lngStr = String.format(java.util.Locale.US, "%.7f", lng);

    // Fetch a larger set from Overpass (we'll filter by name and limit locally)
    int overpassLimit = (nameQuery != null && !nameQuery.isBlank()) ? 500 : limit;

    // Simple query without name regex to avoid Overpass 504 timeouts
    String query = "[out:json][timeout:25];\n(\n"
      + "  node[\"amenity\"~\"restaurant|fast_food|cafe\"][\"name\"](around:" + radiusM + "," + latStr + "," + lngStr + ");\n"
      + "  way[\"amenity\"~\"restaurant|fast_food|cafe\"][\"name\"](around:" + radiusM + "," + latStr + "," + lngStr + ");\n"
      + ");\nout center body " + overpassLimit + ";\n";

    try {
      String json = webClient.post()
        .uri(OVERPASS_URL)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .bodyValue("data=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8))
        .retrieve()
        .bodyToMono(String.class)
        .block();

      if (json == null) return List.of();

      JsonNode root = objectMapper.readTree(json);
      JsonNode elements = root.path("elements");
      if (!elements.isArray()) return List.of();

      List<OverpassRestaurant> results = new ArrayList<>();
      for (JsonNode el : elements) {
        String name = getTag(el, "name");
        if (name == null || name.isBlank()) continue; // Skip unnamed

        // For ways, coordinates are in the "center" sub-object
        double elLat, elLng;
        if (el.has("center")) {
          elLat = el.path("center").path("lat").asDouble();
          elLng = el.path("center").path("lon").asDouble();
        } else {
          elLat = el.path("lat").asDouble();
          elLng = el.path("lon").asDouble();
        }

        String amenity = getTag(el, "amenity");
        String streetAddr = buildAddress(el);

        results.add(new OverpassRestaurant(
          el.path("id").asLong(),
          name,
          getTag(el, "cuisine"),
          streetAddr,
          getTag(el, "addr:city"),
          getTag(el, "addr:state"),
          getTag(el, "addr:country"),
          getTag(el, "phone"),
          getTag(el, "website"),
          getTag(el, "opening_hours"),
          amenity != null ? amenity : "restaurant",
          elLat,
          elLng
        ));
      }

      log.info("Overpass returned {} raw restaurants near ({}, {}) radius={}m",
        results.size(), lat, lng, radiusM);

      // Apply name filter locally (case-insensitive contains)
      if (nameQuery != null && !nameQuery.isBlank()) {
        String lowerQuery = nameQuery.toLowerCase();
        results = results.stream()
          .filter(r -> r.name().toLowerCase().contains(lowerQuery))
          .collect(java.util.stream.Collectors.toList());
        log.info("After name filter '{}': {} restaurants", nameQuery, results.size());
      }

      // Apply limit
      if (results.size() > limit) {
        results = results.subList(0, limit);
      }

      return results;

    } catch (Exception e) {
      log.error("Overpass query failed: {}", e.getMessage());
      return List.of();
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  private String getTag(JsonNode element, String key) {
    JsonNode tags = element.path("tags");
    if (tags.isMissingNode()) return null;
    JsonNode val = tags.path(key);
    return val.isMissingNode() ? null : val.asText();
  }

  private String buildAddress(JsonNode element) {
    String houseNumber = getTag(element, "addr:housenumber");
    String street = getTag(element, "addr:street");
    StringBuilder sb = new StringBuilder();
    if (houseNumber != null && !houseNumber.isBlank()) sb.append(houseNumber);
    if (street != null && !street.isBlank()) {
      if (!sb.isEmpty()) sb.append(" ");
      sb.append(street);
    }
    return sb.isEmpty() ? "" : sb.toString();
  }

  private String firstNonNull(String... vals) {
    for (String v : vals) {
      if (v != null && !v.isBlank()) return v;
    }
    return null;
  }

}
