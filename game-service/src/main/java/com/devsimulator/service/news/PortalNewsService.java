package com.devsimulator.service.news;

import com.devsimulator.api.dto.NewsItemDto;
import com.devsimulator.api.dto.PortalNewsDto;
import com.devsimulator.config.PortalNewsProperties;
import com.devsimulator.model.GameBalance;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ProjectType;
import com.devsimulator.service.CharacterValidator;
import com.devsimulator.service.InteractiveGameEngine;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class PortalNewsService {

    private static final Set<String> FINTECH_KEYWORDS = Set.of(
            "fintech", "payment", "bank", "security", "pci", "fraud", "compliance");
    private static final Set<String> ECOMMERCE_KEYWORDS = Set.of(
            "ecommerce", "shop", "retail", "checkout", "marketplace", "order");
    private static final Set<String> DEVOPS_KEYWORDS = Set.of(
            "kubernetes", "k8s", "docker", "devops", "ci/cd", "grafana", "observability");

    private final PortalNewsProperties properties;
    private final ItNewsCache cache;
    private final ItNewsFeedService feedService;

    public PortalNewsService(
            PortalNewsProperties properties, ItNewsCache cache, ItNewsFeedService feedService) {
        this.properties = properties;
        this.cache = cache;
        this.feedService = feedService;
    }

    public PortalNewsDto getNews(String lang, InteractiveGameEngine engine) {
        feedService.refreshIfNeeded();

        String normalizedLang = normalizeLang(lang);
        ProjectProfile profile = engine.getProjectProfile();
        var player = engine.getPlayer();

        List<NewsItemDto> internal = buildInternalNews(
                profile, player.getDay(), player.getName(), player.getExperienceYears());
        List<NewsItemDto> external = buildExternalNews(normalizedLang, profile.type());

        String cachedAt = cache.getFetchedAt() != null ? cache.getFetchedAt().toString() : null;
        String disclaimer = "ru".equals(normalizedLang)
                ? "Заголовки и ссылки — внешние источники. Career Daily не владеет контентом статей."
                : "Headlines and links are from external sources. Career Daily does not own article content.";

        return new PortalNewsDto(internal, external, cachedAt, cache.isOffline(), disclaimer);
    }

    private List<NewsItemDto> buildInternalNews(
            ProjectProfile profile, int day, String playerName, int experienceYears) {
        List<NewsItemDto> items = new ArrayList<>();
        items.add(news("int-daily",
                "Daily standup сегодня в " + com.devsimulator.model.GameBalance.standupStartTimeLabel()
                        + " — канал " + profile.slackChannel(),
                null, profile.companyName(), "today", "company", true));
        items.add(news("int-onboarding",
                "Onboarding guide обновлён: продукт " + profile.productName(),
                null, "Confluence", "today", "wiki", true));
        if (day <= GameBalance.MIN_DAY_BEFORE_TERMINATION) {
            items.add(news("int-probation",
                    "HR: испытательный срок — день " + day + " из " + GameBalance.MIN_DAY_BEFORE_TERMINATION,
                    null, "HR Portal", "today", "hr", true));
        }
        items.add(news("int-week",
                "Карьерный трек: минимум " + GameBalance.MIN_GAME_DAYS + " рабочих дней до завершения программы",
                null, profile.companyName(), "today", "career", true));
        items.add(news("int-welcome",
                playerName + ", добро пожаловать в команду — "
                        + CharacterValidator.yourRoleFor(profile, experienceYears),
                null, profile.team().get(0).name(), "today", "team", true));
        return items;
    }

    private List<NewsItemDto> buildExternalNews(String lang, ProjectType projectType) {
        List<ItNewsCache.CachedNewsItem> candidates = cache.getItems().stream()
                .filter(item -> matchesLang(item, lang))
                .sorted(Comparator
                        .comparingInt((ItNewsCache.CachedNewsItem item) -> relevanceScore(item, projectType))
                        .reversed()
                        .thenComparing(ItNewsCache.CachedNewsItem::publishedAt, Comparator.reverseOrder()))
                .limit(properties.getMaxItems())
                .toList();

        return candidates.stream()
                .map(item -> news(
                        item.id(),
                        item.title(),
                        item.url(),
                        item.source(),
                        item.publishedAt().toString(),
                        "it",
                        false))
                .toList();
    }

    private static boolean matchesLang(ItNewsCache.CachedNewsItem item, String lang) {
        if ("any".equalsIgnoreCase(item.lang())) {
            return true;
        }
        if ("ru".equals(lang)) {
            return "ru".equalsIgnoreCase(item.lang()) || "en".equalsIgnoreCase(item.lang());
        }
        return "en".equalsIgnoreCase(item.lang()) || "any".equalsIgnoreCase(item.lang());
    }

    private static int relevanceScore(ItNewsCache.CachedNewsItem item, ProjectType type) {
        String title = item.title().toLowerCase(Locale.ROOT);
        int score = 0;
        score += keywordHits(title, DEVOPS_KEYWORDS) * 2;
        score += switch (type) {
            case FINTECH, OPEN_BANKING, INSURTECH -> keywordHits(title, FINTECH_KEYWORDS) * 3;
            case E_COMMERCE, SUPPLY_CHAIN, LOGISTICS -> keywordHits(title, ECOMMERCE_KEYWORDS) * 3;
            default -> keywordHits(title, Set.of("java", "spring", "api", "backend")) * 2;
        };
        if (title.contains("java") || title.contains("spring")) {
            score += 2;
        }
        return score;
    }

    private static int keywordHits(String title, Set<String> keywords) {
        int hits = 0;
        for (String kw : keywords) {
            if (title.contains(kw)) {
                hits++;
            }
        }
        return hits;
    }

    private static NewsItemDto news(
            String id, String title, String url, String source,
            String publishedAt, String category, boolean internal) {
        return new NewsItemDto(id, title, url, source, publishedAt, category, internal);
    }

    private static String normalizeLang(String lang) {
        if (lang == null || lang.isBlank()) {
            return "ru";
        }
        return lang.toLowerCase(Locale.ROOT).startsWith("en") ? "en" : "ru";
    }
}
