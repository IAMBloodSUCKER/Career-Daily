package com.devsimulator.service.news;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ItNewsRefreshScheduler {

    private static final Logger log = LoggerFactory.getLogger(ItNewsRefreshScheduler.class);

    private final ItNewsFeedService feedService;

    public ItNewsRefreshScheduler(ItNewsFeedService feedService) {
        this.feedService = feedService;
    }

    /** Не блокируем старт Spring — RSS может долго отвечать из Docker/без интернета. */
    @EventListener(ApplicationReadyEvent.class)
    public void warmCacheAfterStartup() {
        Thread warm = new Thread(() -> {
            try {
                feedService.refresh();
            } catch (Exception e) {
                log.warn("IT news warm cache failed: {}", e.getMessage());
            }
        }, "it-news-warm");
        warm.setDaemon(true);
        warm.start();
    }

    @Scheduled(fixedDelayString = "#{${portal.news.refresh-minutes:45} * 60 * 1000}")
    public void scheduledRefresh() {
        feedService.refresh();
    }
}
