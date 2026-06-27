package com.devsimulator.service;

import com.devsimulator.api.dto.CaptchaConfigDto;
import com.devsimulator.api.dto.RegisterRequest;
import com.devsimulator.config.CaptchaProperties;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaService {

    private static final Duration CHALLENGE_TTL = Duration.ofMinutes(10);
    private static final int MAX_CHALLENGES = 500;

    private final CaptchaProperties properties;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final Random random = new Random();
    private final Map<String, InternalChallenge> challenges = new ConcurrentHashMap<>();

    public CaptchaService(CaptchaProperties properties) {
        this.properties = properties;
    }

    public CaptchaConfigDto configForRegistration() {
        return switch (activeProvider()) {
            case "none" -> CaptchaConfigDto.none();
            case "yandex" -> new CaptchaConfigDto(
                    "yandex",
                    properties.getYandex().getClientKey().trim(),
                    null,
                    null
            );
            default -> issueInternalChallenge();
        };
    }

    public void verifyRegistration(RegisterRequest request, String clientIp) {
        if ("none".equals(activeProvider())) {
            return;
        }
        if ("yandex".equals(activeProvider())) {
            verifyYandex(request.smartCaptchaToken(), clientIp);
            return;
        }
        verifyInternal(request.captchaId(), request.captchaAnswer());
    }

    private String activeProvider() {
        if (!properties.isEnabled()) {
            return "none";
        }
        if ("yandex".equalsIgnoreCase(properties.getProvider()) && properties.getYandex().isConfigured()) {
            return "yandex";
        }
        if ("none".equalsIgnoreCase(properties.getProvider())) {
            return "none";
        }
        return "internal";
    }

    private CaptchaConfigDto issueInternalChallenge() {
        purgeExpired();
        int a = 2 + random.nextInt(18);
        int b = 2 + random.nextInt(18);
        boolean multiply = random.nextBoolean();
        int answer = multiply ? a * b : a + b;
        String question = multiply ? a + " * " + b + " = ?" : a + " + " + b + " = ?";
        String id = UUID.randomUUID().toString();
        challenges.put(id, new InternalChallenge(answer, Instant.now().plus(CHALLENGE_TTL)));
        trimIfNeeded();
        return new CaptchaConfigDto("internal", null, id, question);
    }

    private void verifyInternal(String captchaId, String captchaAnswer) {
        if (captchaId == null || captchaId.isBlank()) {
            throw new IllegalArgumentException("Решите задачу капчи");
        }
        if (captchaAnswer == null || captchaAnswer.isBlank()) {
            throw new IllegalArgumentException("Введите ответ капчи");
        }
        InternalChallenge challenge = challenges.remove(captchaId.trim());
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Капча устарела — обновите задачу");
        }
        int given;
        try {
            given = Integer.parseInt(captchaAnswer.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Ответ капчи должен быть числом");
        }
        if (given != challenge.answer()) {
            throw new IllegalArgumentException("Неверный ответ капчи");
        }
    }

    private void verifyYandex(String token, String clientIp) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Подтвердите, что вы не робот (капча)");
        }
        String secret = properties.getYandex().getServerKey().trim();
        String body = "secret=" + encode(secret)
                + "&token=" + encode(token.trim())
                + "&ip=" + encode(clientIp != null ? clientIp : "");
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://smartcaptcha.yandexcloud.net/validate"))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 || !response.body().contains("\"status\":\"ok\"")) {
                throw new IllegalArgumentException("Капча не пройдена — попробуйте снова");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Сервис капчи недоступен — повторите позже");
        }
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        challenges.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }

    private void trimIfNeeded() {
        if (challenges.size() <= MAX_CHALLENGES) {
            return;
        }
        purgeExpired();
        while (challenges.size() > MAX_CHALLENGES) {
            String first = challenges.keySet().iterator().next();
            challenges.remove(first);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record InternalChallenge(int answer, Instant expiresAt) {
    }
}
