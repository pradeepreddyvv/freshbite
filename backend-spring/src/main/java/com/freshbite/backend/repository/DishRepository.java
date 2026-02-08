package com.freshbite.backend.repository;

import com.freshbite.backend.domain.Dish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DishRepository extends JpaRepository<Dish, String> {
  List<Dish> findAllByOrderByNameAsc();
  Optional<Dish> findByNameIgnoreCase(String name);
}
