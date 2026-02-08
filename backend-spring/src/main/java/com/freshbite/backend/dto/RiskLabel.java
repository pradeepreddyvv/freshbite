package com.freshbite.backend.dto;

public record RiskLabel(
  String level,
  String label,
  String emoji,
  String color,
  String bgColor
) {}
