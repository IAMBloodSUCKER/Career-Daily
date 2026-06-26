package com.devsimulator.persistence;

import com.devsimulator.persistence.snapshot.GameEngineSnapshot;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class GameStateSerializer {

    private final ObjectMapper objectMapper;

    public GameStateSerializer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String toJson(GameEngineSnapshot snapshot) {
        try {
            return objectMapper.writeValueAsString(snapshot);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize game state", e);
        }
    }

    public GameEngineSnapshot fromJson(String json) {
        try {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(json);
            if (node.isObject() && !node.has("team")) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).putArray("team");
            }
            if (node.isObject() && !node.has("wallpaperIndex")) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("wallpaperIndex", 0);
            }
            if (node.isObject() && !node.has("pendingWorkloadContactId")) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).putNull("pendingWorkloadContactId");
            }
            if (node.isObject() && !node.has("lastBonusInjectionMs")) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("lastBonusInjectionMs", 0);
            }
            if (node.isObject() && !node.has("bonusTasksInjectedToday")) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("bonusTasksInjectedToday", 0);
            }
            if (node.isObject() && !node.has("workIdleSinceMs")) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("workIdleSinceMs", 0);
            }
            if (node.isObject() && node.has("dailyTasks") && node.get("dailyTasks").isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode task : node.get("dailyTasks")) {
                    if (task.isObject() && !task.has("scenarioTag")) {
                        String ticket = task.has("ticketId") ? task.get("ticketId").asText() : "";
                        ((com.fasterxml.jackson.databind.node.ObjectNode) task)
                                .put("scenarioTag", com.devsimulator.model.ScenarioTag.inferFromTicketId(ticket).name());
                    }
                }
            }
            return objectMapper.treeToValue(node, GameEngineSnapshot.class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize game state", e);
        }
    }
}
