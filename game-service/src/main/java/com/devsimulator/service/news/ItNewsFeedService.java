package com.devsimulator.service.news;

import com.devsimulator.config.PortalNewsProperties;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class ItNewsFeedService {

    private static final Logger log = LoggerFactory.getLogger(ItNewsFeedService.class);

    private final PortalNewsProperties properties;
    private final ItNewsCache cache;
    private final HttpClient httpClient;

    public ItNewsFeedService(PortalNewsProperties properties, ItNewsCache cache) {
        this.properties = properties;
        this.cache = cache;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(properties.getFetchTimeoutSeconds()))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public void refreshIfNeeded() {
        if (!properties.isEnabled()) {
            return;
        }
        Instant fetchedAt = cache.getFetchedAt();
        if (fetchedAt != null
                && fetchedAt.isAfter(Instant.now().minus(Duration.ofMinutes(properties.getRefreshMinutes())))) {
            return;
        }
        refresh();
    }

    public void refresh() {
        if (!properties.isEnabled()) {
            cache.update(List.of(), true);
            return;
        }

        Map<String, ItNewsCache.CachedNewsItem> deduped = new LinkedHashMap<>();

        for (PortalNewsProperties.Feed feed : properties.getFeeds()) {
            try {
                List<ItNewsCache.CachedNewsItem> parsed = fetchFeed(feed);
                for (ItNewsCache.CachedNewsItem item : parsed) {
                    deduped.putIfAbsent(item.url(), item);
                }
            } catch (Exception e) {
                log.warn("IT news feed failed: {} — {}", feed.getName(), e.getMessage());
            }
        }

        List<ItNewsCache.CachedNewsItem> items;
        boolean offline;
        if (deduped.isEmpty()) {
            items = fallbackItems();
            offline = true;
        } else {
            items = deduped.values().stream()
                    .sorted(Comparator.comparing(ItNewsCache.CachedNewsItem::publishedAt).reversed())
                    .limit(properties.getMaxItems() * 2L)
                    .toList();
            offline = false;
        }
        cache.update(items, offline);
    }

    private List<ItNewsCache.CachedNewsItem> fetchFeed(PortalNewsProperties.Feed feed) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(feed.getUrl()))
                .timeout(Duration.ofSeconds(properties.getFetchTimeoutSeconds()))
                .header("User-Agent", "CareerDaily-Portal/1.0")
                .GET()
                .build();

        HttpResponse<byte[]> response = sendWithTimeout(request);
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("HTTP " + response.statusCode());
        }

        SyndFeedInput input = new SyndFeedInput();
        SyndFeed syndFeed;
        try (XmlReader reader = new XmlReader(new java.io.ByteArrayInputStream(response.body()))) {
            syndFeed = input.build(reader);
        }

        List<ItNewsCache.CachedNewsItem> items = new ArrayList<>();
        for (SyndEntry entry : syndFeed.getEntries()) {
            String title = clean(entry.getTitle());
            String link = entry.getLink();
            if (title == null || title.isBlank() || link == null || link.isBlank()) {
                continue;
            }
            Instant published = entry.getPublishedDate() != null
                    ? entry.getPublishedDate().toInstant()
                    : Instant.now();
            items.add(new ItNewsCache.CachedNewsItem(
                    UUID.nameUUIDFromBytes(link.getBytes()).toString(),
                    title,
                    link,
                    feed.getName(),
                    published,
                    feed.getLang()
            ));
            if (items.size() >= properties.getMaxItems()) {
                break;
            }
        }
        return items;
    }

    private HttpResponse<byte[]> sendWithTimeout(HttpRequest request) throws Exception {
        int seconds = Math.max(3, properties.getFetchTimeoutSeconds());
        CompletableFuture<HttpResponse<byte[]>> future = CompletableFuture.supplyAsync(() -> {
            try {
                return httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException(e);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
        try {
            return future.get(seconds + 2L, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            throw new IllegalStateException("feed fetch timed out after " + seconds + "s");
        } catch (java.util.concurrent.ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof Exception ex) {
                throw ex;
            }
            throw e;
        }
    }

    private static String clean(String title) {
        if (title == null) {
            return "";
        }
        return title.replaceAll("\\s+", " ").trim();
    }

    private List<ItNewsCache.CachedNewsItem> fallbackItems() {
        Instant now = Instant.now();
        if (!cache.getItems().isEmpty()) {
            return cache.getItems();
        }
        return List.of(
                item("fb-1", "Spring Boot 3.x — release notes and migration tips", "https://spring.io/blog", "Career Daily digest", now, "en"),
                item("fb-2", "Kubernetes 1.30 — what changed for Java workloads", "https://kubernetes.io/blog/", "Career Daily digest", now.minus(Duration.ofHours(2)), "en"),
                item("fb-3", "PostgreSQL 16 — performance improvements overview", "https://www.postgresql.org/about/news/", "Career Daily digest", now.minus(Duration.ofHours(5)), "en"),
                item("fb-4", "Java 21 LTS — virtual threads in production", "https://openjdk.org/", "Career Daily digest", now.minus(Duration.ofHours(8)), "en"),
                item("fb-5", "Обновления в экосистеме Java и Spring", "https://habr.com/ru/hub/java/", "Офлайн-дайджест", now.minus(Duration.ofHours(3)), "ru"),
                item("fb-6", "DevOps: CI/CD и observability — подборка", "https://habr.com/ru/hub/devops/", "Офлайн-дайджест", now.minus(Duration.ofHours(6)), "ru")
        );
    }

    private static ItNewsCache.CachedNewsItem item(
            String id, String title, String url, String source, Instant published, String lang) {
        return new ItNewsCache.CachedNewsItem(id, title, url, source, published, lang);
    }
}
