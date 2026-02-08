package com.freshbite.backend.controller;

import com.freshbite.backend.domain.Restaurant;
import com.freshbite.backend.dto.DiscoverResponse;
import com.freshbite.backend.dto.DiscoveredRestaurant;
import com.freshbite.backend.repository.RestaurantRepository;
import com.freshbite.backend.service.NominatimService;
import com.freshbite.backend.service.OverpassService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * Discover real restaurants from OpenStreetMap data + FreshBite database.
 * Merges results from both sources so manually-added restaurants also appear.
 */
@RestController
@RequestMapping("/api")
public class DiscoverController {
  private static final Logger log = LoggerFactory.getLogger(DiscoverController.class);

  private final OverpassService overpassService;
  private final NominatimService nominatimService;
  private final RestaurantRepository restaurantRepository;

  public DiscoverController(OverpassService overpassService,
                            NominatimService nominatimService,
                            RestaurantRepository restaurantRepository) {
    this.overpassService = overpassService;
    this.nominatimService = nominatimService;
    this.restaurantRepository = restaurantRepository;
  }

  /**
   * Discover restaurants using OpenStreetMap data.
   *
   * Usage:
   *   GET /api/discover?lat=33.45&lng=-112.07                    → nearby restaurants
   *   GET /api/discover?location=Phoenix,Arizona                 → geocode + nearby
   *   GET /api/discover?location=Phoenix,Arizona&name=McDonald   → geocode + search by name
   *   GET /api/discover?lat=33.45&lng=-112.07&name=Subway        → nearby Subways
   *
   * @param lat       user latitude (from browser geolocation)
   * @param lng       user longitude (from browser geolocation)
   * @param location  place name to geocode (e.g. "Arizona", "Phoenix, AZ", "Tokyo")
   * @param name      restaurant name filter (e.g. "McDonald's", "Subway", "KFC")
   * @param radius    search radius in meters (default 5000 = 5km, max 50000 = 50km)
   * @param limit     max results (default 100, max 200)
   */
  @GetMapping("/discover")
  public DiscoverResponse discover(
    @RequestParam(required = false) Double lat,
    @RequestParam(required = false) Double lng,
    @RequestParam(required = false) String location,
    @RequestParam(required = false) String name,
    @RequestParam(defaultValue = "5000") int radius,
    @RequestParam(defaultValue = "100") int limit
  ) {
    // Clamp parameters
    radius = Math.min(Math.max(radius, 500), 50000);
    limit = Math.min(Math.max(limit, 10), 200);

    double centerLat;
    double centerLng;
    String resolvedLocation = null;

    // Step 1: Determine center coordinates
    if (lat != null && lng != null) {
      centerLat = lat;
      centerLng = lng;

      // If location is also provided, geocode it instead (user typed a place)
      if (location != null && !location.isBlank()) {
        NominatimService.GeoResult geo = nominatimService.geocode(location);
        if (geo != null) {
          centerLat = geo.lat();
          centerLng = geo.lng();
          resolvedLocation = geo.displayName();
          log.info("Geocoded '{}' → ({}, {}) = {}", location, centerLat, centerLng, resolvedLocation);
        }
      }
    } else if (location != null && !location.isBlank()) {
      // No coordinates, must geocode the location name
      NominatimService.GeoResult geo = nominatimService.geocode(location);
      if (geo == null) {
        return new DiscoverResponse(
          "Could not find location: " + location,
          null, null, 0, List.of()
        );
      }
      centerLat = geo.lat();
      centerLng = geo.lng();
      resolvedLocation = geo.displayName();
      log.info("Geocoded '{}' → ({}, {}) = {}", location, centerLat, centerLng, resolvedLocation);
    } else {
      // No location at all — default to a central US location
      centerLat = 39.8283;
      centerLng = -98.5795;
      resolvedLocation = "Central United States (default)";
      radius = 50000; // Expand radius for default
    }

    // Step 2: Query Overpass for real restaurants
    List<OverpassService.OverpassRestaurant> osmResults =
      overpassService.findNearby(centerLat, centerLng, radius, name, limit);

    // Step 3: Also query FreshBite DB for manually-added restaurants
    List<Restaurant> dbResults;
    if (name != null && !name.isBlank()) {
      dbResults = restaurantRepository.searchByText(name);
    } else {
      dbResults = restaurantRepository.searchByText("");
    }

    // Step 4: Convert OSM results to DTOs
    List<DiscoveredRestaurant> restaurants = new ArrayList<>();
    final double cLat = centerLat;
    final double cLng = centerLng;

    for (var osm : osmResults) {
      double dist = haversine(cLat, cLng, osm.latitude(), osm.longitude());
      restaurants.add(new DiscoveredRestaurant(
        osm.osmId(),
        osm.name(),
        osm.cuisine(),
        osm.address(),
        osm.city(),
        osm.state(),
        osm.country(),
        osm.phone(),
        osm.website(),
        osm.openingHours(),
        osm.type(),
        osm.latitude(),
        osm.longitude(),
        Math.round(dist * 100.0) / 100.0,
        "osm",
        null
      ));
    }

    // Step 5: Merge FreshBite DB restaurants (source = "freshbite")
    for (Restaurant r : dbResults) {
      if (r.getLatitude() == null || r.getLongitude() == null) continue;
      double dist = haversine(cLat, cLng, r.getLatitude(), r.getLongitude());
      // Only include DB restaurants within the search radius (in km)
      double radiusKm = radius / 1000.0;
      if (dist > radiusKm * 1.5) continue; // Allow 50% overshoot for DB results

      restaurants.add(new DiscoveredRestaurant(
        0L, // no OSM id
        r.getName(),
        null,
        r.getAddress(),
        r.getCity(),
        r.getState(),
        r.getCountry(),
        null,
        null,
        null,
        "restaurant",
        r.getLatitude(),
        r.getLongitude(),
        Math.round(dist * 100.0) / 100.0,
        "freshbite",
        r.getId()
      ));
    }

    // Sort by distance
    restaurants.sort((a, b) -> {
      if (a.distanceKm() == null) return 1;
      if (b.distanceKm() == null) return -1;
      return Double.compare(a.distanceKm(), b.distanceKm());
    });

    return new DiscoverResponse(
      resolvedLocation,
      centerLat,
      centerLng,
      restaurants.size(),
      restaurants
    );
  }

  // ── Haversine distance ──────────────────────────────────

  private double haversine(double lat1, double lng1, double lat2, double lng2) {
    double R = 6371.0; // Earth radius in km
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
               Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
               Math.sin(dLng / 2) * Math.sin(dLng / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
