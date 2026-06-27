package com.devsimulator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "portal.news")
public class PortalNewsProperties {

    private boolean enabled = true;
    private int refreshMinutes = 45;
    private int maxItems = 12;
    private int fetchTimeoutSeconds = 8;
    private List<Feed> feeds = defaultFeeds();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getRefreshMinutes() {
        return refreshMinutes;
    }

    public void setRefreshMinutes(int refreshMinutes) {
        this.refreshMinutes = refreshMinutes;
    }

    public int getMaxItems() {
        return maxItems;
    }

    public void setMaxItems(int maxItems) {
        this.maxItems = maxItems;
    }

    public int getFetchTimeoutSeconds() {
        return fetchTimeoutSeconds;
    }

    public void setFetchTimeoutSeconds(int fetchTimeoutSeconds) {
        this.fetchTimeoutSeconds = fetchTimeoutSeconds;
    }

    public List<Feed> getFeeds() {
        return feeds;
    }

    public void setFeeds(List<Feed> feeds) {
        this.feeds = feeds != null && !feeds.isEmpty() ? feeds : defaultFeeds();
    }

    private static List<Feed> defaultFeeds() {
        return List.of(
                new Feed("Hacker News", "https://hnrss.org/frontpage", "en"),
                new Feed("Spring Blog", "https://spring.io/blog.atom", "en"),
                new Feed("JetBrains Blog", "https://blog.jetbrains.com/feed/", "en"),
                new Feed("Habr — Java", "https://habr.com/ru/rss/hub/java/all/?fl=ru", "ru"),
                new Feed("Habr — DevOps", "https://habr.com/ru/rss/hub/devops/all/?fl=ru", "ru")
        );
    }

    public static class Feed {
        private String name;
        private String url;
        private String lang = "any";

        public Feed() {
        }

        public Feed(String name, String url, String lang) {
            this.name = name;
            this.url = url;
            this.lang = lang;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getLang() {
            return lang;
        }

        public void setLang(String lang) {
            this.lang = lang;
        }
    }
}
