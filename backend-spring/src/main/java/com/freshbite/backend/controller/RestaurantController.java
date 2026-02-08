package com.freshbite.backend.controller;

import com.freshbite.backend.domain.Dish;
import com.freshbite.backend.domain.DishAtRestaurant;
import com.freshbite.backend.domain.Restaurant;
import com.freshbite.backend.dto.CreateDishAtRestaurantRequest;
import com.freshbite.backend.dto.CreateRestaurantRequest;
import com.freshbite.backend.dto.DishAtRestaurantResponse;
import com.freshbite.backend.dto.RestaurantResponse;
import com.freshbite.backend.dto.RestaurantSearchResponse;
import com.freshbite.backend.repository.DishAtRestaurantRepository;
import com.freshbite.backend.repository.DishRepository;
import com.freshbite.backend.repository.RestaurantRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.sql.Timestamp;

@RestController
@RequestMapping("/api")
public class RestaurantController {
  private final RestaurantRepository restaurantRepository;
  private final DishRepository dishRepository;
  private final DishAtRestaurantRepository dishAtRestaurantRepository;

  public RestaurantController(
    RestaurantRepository restaurantRepository,
    DishRepository dishRepository,
    DishAtRestaurantRepository dishAtRestaurantRepository
  ) {
    this.restaurantRepository = restaurantRepository;
    this.dishRepository = dishRepository;
    this.dishAtRestaurantRepository = dishAtRestaurantRepository;
  }

  // ── Restaurants ──────────────────────────────────────────

  @GetMapping("/restaurants")
  public List<RestaurantResponse> listRestaurants() {
    return restaurantRepository.findAllByOrderByCreatedAtDesc()
      .stream()
      .map(this::toRestaurantResponse)
      .toList();
  }

  @PostMapping("/restaurants")
  @ResponseStatus(HttpStatus.CREATED)
  public RestaurantResponse createRestaurant(@Valid @RequestBody CreateRestaurantRequest request) {
    Restaurant restaurant = new Restaurant();
    restaurant.setId(generateCuid());
    restaurant.setName(request.name());
    restaurant.setAddress(request.address());
    restaurant.setCity(request.city());
    if (request.state() != null) restaurant.setState(request.state());
    if (request.country() != null) restaurant.setCountry(request.country());
    if (request.timezone() != null) restaurant.setTimezone(request.timezone());
    if (request.latitude() != null) restaurant.setLatitude(request.latitude());
    if (request.longitude() != null) restaurant.setLongitude(request.longitude());

    Restaurant saved = restaurantRepository.save(restaurant);
    return toRestaurantResponse(saved);
  }

  // ── Dishes at Restaurant ─────────────────────────────────

  @GetMapping("/restaurants/search")
  public List<RestaurantSearchResponse> searchRestaurants(
    @RequestParam(defaultValue = "") String q,
    @RequestParam(required = false) Double lat,
    @RequestParam(required = false) Double lng
  ) {
    if (lat != null && lng != null) {
      // Proximity search with Haversine distance
      return restaurantRepository.searchNearby(q, lat, lng).stream()
        .map(row -> {
          String id = (String) row[0];
          String name = (String) row[1];
          String address = (String) row[2];
          String city = (String) row[3];
          String state = (String) row[4];
          String country = (String) row[5];
          // row[6] = timezone
          Double latitude = row[7] != null ? ((Number) row[7]).doubleValue() : null;
          Double longitude = row[8] != null ? ((Number) row[8]).doubleValue() : null;
          // row[9] = createdAt, row[10] = updatedAt
          Timestamp createdTs = (Timestamp) row[9];
          Double distanceKm = row[11] != null ? ((Number) row[11]).doubleValue() : null;
          return new RestaurantSearchResponse(
            id, name, address, city, state, country,
            latitude, longitude,
            distanceKm != null ? Math.round(distanceKm * 100.0) / 100.0 : null,
            createdTs != null ? createdTs.toInstant() : null
          );
        })
        .toList();
    } else {
      // Text-only search, no proximity
      return restaurantRepository.searchByText(q).stream()
        .map(r -> new RestaurantSearchResponse(
          r.getId(), r.getName(), r.getAddress(), r.getCity(),
          r.getState(), r.getCountry(), r.getLatitude(), r.getLongitude(),
          null, r.getCreatedAt()
        ))
        .toList();
    }
  }

  // ── Dishes at Restaurant (detail) ───────────────────────

  @GetMapping("/restaurants/{restaurantId}/dishes")
  public List<DishAtRestaurantResponse> listDishesAtRestaurant(@PathVariable String restaurantId) {
    Restaurant restaurant = restaurantRepository.findById(restaurantId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

    return dishAtRestaurantRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
      .map(this::toDishAtRestaurantResponse)
      .toList();
  }

  @PostMapping("/restaurants/{restaurantId}/dishes")
  @ResponseStatus(HttpStatus.CREATED)
  public DishAtRestaurantResponse addDishToRestaurant(
    @PathVariable String restaurantId,
    @Valid @RequestBody CreateDishAtRestaurantRequest request
  ) {
    Restaurant restaurant = restaurantRepository.findById(restaurantId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

    // Find or create the dish
    Dish dish = dishRepository.findByNameIgnoreCase(request.dishName())
      .orElseGet(() -> {
        Dish newDish = new Dish();
        newDish.setId(generateCuid());
        newDish.setName(request.dishName());
        newDish.setCuisine(request.cuisine());
        newDish.setDescription(request.description());
        return dishRepository.save(newDish);
      });

    // Create DishAtRestaurant link
    DishAtRestaurant dar = new DishAtRestaurant();
    dar.setId(generateCuid());
    dar.setRestaurant(restaurant);
    dar.setDish(dish);
    dar.setPrice(request.price());
    dar.setActive(true);

    DishAtRestaurant saved = dishAtRestaurantRepository.save(dar);
    return toDishAtRestaurantResponse(saved);
  }

  // ── Helpers ──────────────────────────────────────────────

  private String generateCuid() {
    // Prisma uses CUIDs; we generate a UUID-style id for compatibility
    // Prisma CUIDs are 25-char strings. We use a simplified prefix + random approach.
    return "c" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
  }

  private RestaurantResponse toRestaurantResponse(Restaurant r) {
    return new RestaurantResponse(
      r.getId(), r.getName(), r.getAddress(), r.getCity(),
      r.getState(), r.getCountry(), r.getLatitude(), r.getLongitude(),
      r.getCreatedAt()
    );
  }

  private DishAtRestaurantResponse toDishAtRestaurantResponse(DishAtRestaurant dar) {
    return new DishAtRestaurantResponse(
      dar.getId(),
      dar.getDish().getName(),
      dar.getDish().getCuisine(),
      dar.getDish().getDescription(),
      dar.getPrice(),
      dar.getRestaurant().getId(),
      dar.getRestaurant().getName(),
      dar.getCreatedAt()
    );
  }
}
