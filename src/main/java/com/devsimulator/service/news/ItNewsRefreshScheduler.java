package com.devsimulator.service.news;

import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ItNewsRefreshScheduler {

    private final ItNewsFeedService feedService;

    public ItNewsRefreshScheduler(ItNewsFeedService feedService) {
        this.feedService = feedService;
    }

    @PostConstruct
    public void warmCache() {
        feedService.refresh();
    }

    @Scheduled(fixedDelayString = "#{${portal.news.refresh-minutes:45} * 60 * 1000}")
    public void scheduledRefresh() {
        feedService.refresh();
    }
}
