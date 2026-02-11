package com.freshbite.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AlertsController {
  private static final Logger log = LoggerFactory.getLogger(AlertsController.class);

  @PostMapping("/alerts/run")
  public Map<String, Object> runAlerts() {
    log.info("POST /api/alerts/run (stub)");
    return Map.of(
      "success", true,
      "evaluatedCount", 0,
      "alertsTriggered", 0,
      "results", new Object[0],
      "metadata", Map.of("isStub", true, "message", "Alerts not wired yet")
    );
  }
}
