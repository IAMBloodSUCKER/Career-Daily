package com.devsimulator.service;

import com.devsimulator.api.dto.CaptchaConfigDto;
import com.devsimulator.api.dto.CaptchaTileDto;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class CaptchaService {

    private static final Duration CHALLENGE_TTL = Duration.ofMinutes(10);
    private static final int MAX_CHALLENGES = 500;
    private static final int SLIDER_TOLERANCE = 8;
    private static final int GRID_SIZE = 9;

    private static final List<ImageCategory> IMAGE_CATEGORIES = List.of(
            new ImageCategory("транспорт", List.of("🚗", "🚌", "🚕", "🚙", "🛻")),
            new ImageCategory("фрукты", List.of("🍎", "🍌", "🍇", "🍊", "🍓")),
            new ImageCategory("животные", List.of("🐱", "🐶", "🐻", "🦊", "🐼")),
            new ImageCategory("еда", List.of("🍕", "🍔", "🌮", "🍣", "🥗")),
            new ImageCategory("спорт", List.of("⚽", "🏀", "🎾", "🏐", "🥎"))
    );

    private static final List<String> DISTRACTOR_ICONS = List.of(
            "☕", "📱", "💡", "🎵", "📚", "⌨️", "🖥️", "🎮", "🧩", "🔧", "📎", "🌧️"
    );

    private static final List<String> SLIDER_MARKS = List.of("A", "B", "C", "D", "E");

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
                    null,
                    null,
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
        if (random.nextBoolean()) {
            return issueImageChallenge();
        }
        return issueSliderChallenge();
    }

    private CaptchaConfigDto issueImageChallenge() {
        ImageCategory category = IMAGE_CATEGORIES.get(random.nextInt(IMAGE_CATEGORIES.size()));
        int correctCount = 3 + random.nextInt(2);

        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i < GRID_SIZE; i++) {
            indices.add(i);
        }
        Collections.shuffle(indices, random);
        Set<Integer> correctIndices = new HashSet<>(indices.subList(0, correctCount));

        List<String> shuffledDistractors = new ArrayList<>(DISTRACTOR_ICONS);
        Collections.shuffle(shuffledDistractors, random);

        List<CaptchaTileDto> tiles = new ArrayList<>(GRID_SIZE);
        for (int i = 0; i < GRID_SIZE; i++) {
            String icon = correctIndices.contains(i)
                    ? category.icons().get(random.nextInt(category.icons().size()))
                    : shuffledDistractors.get(random.nextInt(shuffledDistractors.size()));
            tiles.add(new CaptchaTileDto(i, icon));
        }

        String id = UUID.randomUUID().toString();
        String expected = correctIndices.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        challenges.put(id, new InternalChallenge("image", expected, Instant.now().plus(CHALLENGE_TTL)));
        trimIfNeeded();

        String sample = category.icons().get(0);
        String question = "Выберите все: " + sample + " (" + category.labelRu() + ")";
        return new CaptchaConfigDto("internal", null, id, question, "image", tiles, null);
    }

    private CaptchaConfigDto issueSliderChallenge() {
        int slot = random.nextInt(SLIDER_MARKS.size());
        int target = slot * 25;
        String mark = SLIDER_MARKS.get(slot);

        String id = UUID.randomUUID().toString();
        challenges.put(id, new InternalChallenge("slider", String.valueOf(target), Instant.now().plus(CHALLENGE_TTL)));
        trimIfNeeded();

        String question = "Перетащите стрелку → на метку " + mark;
        return new CaptchaConfigDto(
                "internal",
                null,
                id,
                question,
                "slider",
                null,
                SLIDER_MARKS
        );
    }

    private void verifyInternal(String captchaId, String captchaAnswer) {
        if (captchaId == null || captchaId.isBlank()) {
            throw new IllegalArgumentException("Пройдите проверку капчи");
        }
        if (captchaAnswer == null || captchaAnswer.isBlank()) {
            throw new IllegalArgumentException("Пройдите проверку капчи");
        }

        InternalChallenge challenge = challenges.remove(captchaId.trim());
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Капча устарела — обновите задачу");
        }

        if ("slider".equals(challenge.kind())) {
            verifySlider(challenge.expectedAnswer(), captchaAnswer);
            return;
        }
        verifyImage(challenge.expectedAnswer(), captchaAnswer);
    }

    private void verifyImage(String expected, String given) {
        Set<Integer> expectedSet = parseIndexSet(expected);
        Set<Integer> givenSet = parseIndexSet(given);
        if (givenSet.isEmpty()) {
            throw new IllegalArgumentException("Выберите нужные картинки");
        }
        if (!expectedSet.equals(givenSet)) {
            throw new IllegalArgumentException("Неверный выбор — попробуйте снова");
        }
    }

    private void verifySlider(String expected, String given) {
        int target;
        int value;
        try {
            target = Integer.parseInt(expected.trim());
            value = Integer.parseInt(given.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Перетащите ползунок на нужную метку");
        }
        if (Math.abs(value - target) > SLIDER_TOLERANCE) {
            throw new IllegalArgumentException("Ползунок не на метке — попробуйте точнее");
        }
    }

    private static Set<Integer> parseIndexSet(String raw) {
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return Integer.parseInt(s);
                    } catch (NumberFormatException e) {
                        return -1;
                    }
                })
                .filter(i -> i >= 0)
                .collect(Collectors.toCollection(HashSet::new));
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

    private record ImageCategory(String labelRu, List<String> icons) {
    }

    private record InternalChallenge(String kind, String expectedAnswer, Instant expiresAt) {
    }
}
