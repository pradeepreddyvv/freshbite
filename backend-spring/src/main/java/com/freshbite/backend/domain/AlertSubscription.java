package com.freshbite.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "\"AlertSubscription\"")
public class AlertSubscription {
  @Id
  @Column(name = "id")
  private String id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "\"dishAtRestaurantId\"")
  private DishAtRestaurant dishAtRestaurant;

  private String email;

  private String phone;

  @Column(nullable = false)
  private String window = "24h";

  @Column(name = "\"minRating\"", nullable = false)
  private double minRating = 3.0;

  @Column(name = "\"isActive\"", nullable = false)
  private boolean isActive = true;

  @CreationTimestamp
  @Column(name = "\"createdAt\"")
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "\"updatedAt\"")
  private Instant updatedAt;

  public String getId() {
    return id;
  }

  public DishAtRestaurant getDishAtRestaurant() {
    return dishAtRestaurant;
  }

  public void setDishAtRestaurant(DishAtRestaurant dishAtRestaurant) {
    this.dishAtRestaurant = dishAtRestaurant;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getWindow() {
    return window;
  }

  public void setWindow(String window) {
    this.window = window;
  }

  public double getMinRating() {
    return minRating;
  }

  public void setMinRating(double minRating) {
    this.minRating = minRating;
  }

  public boolean isActive() {
    return isActive;
  }

  public void setActive(boolean active) {
    isActive = active;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
