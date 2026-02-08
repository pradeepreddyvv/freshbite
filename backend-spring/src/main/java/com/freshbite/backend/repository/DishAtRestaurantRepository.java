package com.freshbite.backend.repository;

import com.freshbite.backend.domain.DishAtRestaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DishAtRestaurantRepository extends JpaRepository<DishAtRestaurant, String> {
  List<DishAtRestaurant> findTop10ByIsActiveTrueOrderByCreatedAtDesc();
  List<DishAtRestaurant> findByRestaurantIdOrderByCreatedAtDesc(String restaurantId);
}
