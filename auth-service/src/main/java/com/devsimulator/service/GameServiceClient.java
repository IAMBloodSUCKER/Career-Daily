package com.devsimulator.service;

import com.devsimulator.config.GameServiceClientProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class GameServiceClient {

    private final RestTemplate restTemplate;
    private final GameServiceClientProperties properties;

    public GameServiceClient(GameServiceClientProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
    }

    public long countSaves() {
        try {
            Map<String, Long> body = get("/internal/saves/stats", new ParameterizedTypeReference<>() {});
            return body != null && body.get("saveCount") != null ? body.get("saveCount") : 0L;
        } catch (RestClientException e) {
            return 0L;
        }
    }

    public Map<Long, String> saveSummaries() {
        try {
            List<Map<String, Object>> rows = get("/internal/saves/summaries", new ParameterizedTypeReference<>() {});
            if (rows == null) return Collections.emptyMap();
            return rows.stream().collect(java.util.stream.Collectors.toMap(
                    r -> ((Number) r.get("userId")).longValue(),
                    r -> String.valueOf(r.get("summary")),
                    (a, b) -> a
            ));
        } catch (RestClientException e) {
            return Collections.emptyMap();
        }
    }

    public void deleteSave(Long userId) {
        try {
            restTemplate.exchange(
                    properties.getBaseUrl() + "/internal/saves/" + userId,
                    HttpMethod.DELETE,
                    new HttpEntity<>(internalHeaders()),
                    Void.class
            );
        } catch (RestClientException ignored) {
            // best effort before user delete
        }
    }

    private <T> T get(String path, ParameterizedTypeReference<T> type) {
        ResponseEntity<T> response = restTemplate.exchange(
                properties.getBaseUrl() + path,
                HttpMethod.GET,
                new HttpEntity<>(internalHeaders()),
                type
        );
        return response.getBody();
    }

    private HttpHeaders internalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", properties.getInternalToken());
        return headers;
    }
}
