package com.freshbite.backend.dto;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;

public enum TimeWindow {
  H24("24h", Duration.ofHours(24)),
  H48("48h", Duration.ofHours(48)),
  D5("5d", Duration.ofDays(5));

  private final String value;
  private final Duration duration;

  TimeWindow(String value, Duration duration) {
    this.value = value;
    this.duration = duration;
  }

  public String getValue() {
    return value;
  }

  public Instant cutoff(Instant now) {
    return now.minus(duration);
  }

  public static TimeWindow from(String raw, TimeWindow fallback) {
    return Arrays.stream(values())
      .filter(item -> item.value.equals(raw))
      .findFirst()
      .orElse(fallback);
  }
}
