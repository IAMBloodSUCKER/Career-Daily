package com.devsimulator.service.news;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
public class ItNewsCache {

    private volatile List<CachedNewsItem> items = List.of();
    private volatile Instant fetchedAt;
    private volatile boolean offline;

    public List<CachedNewsItem> getItems() {
        return items;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public boolean isOffline() {
        return offline;
    }

    public void update(List<CachedNewsItem> fresh, boolean offlineMode) {
        this.items = Collections.unmodifiableList(List.copyOf(fresh));
        this.fetchedAt = Instant.now();
        this.offline = offlineMode;
    }

    public record CachedNewsItem(
            String id,
            String title,
            String url,
            String source,
            Instant publishedAt,
            String lang
    ) {
    }
}
