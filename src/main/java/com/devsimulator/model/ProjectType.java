package com.devsimulator.model;

public enum ProjectType {
    E_COMMERCE(
            "ShopFlow",
            "E-commerce",
            "🛒",
            "Интернет-магазин с миллионами заказов. Checkout, корзина, оплата."
    ),
    FINTECH(
            "PaySecure",
            "FinTech",
            "💳",
            "Платёжный шлюз. PCI DSS, транзакции, antifraud — ошибка стоит дорого."
    ),
    STARTUP(
            "QuickLaunch",
            "Стартап",
            "🚀",
            "MVP за 2 недели. Мало процессов, много свободы, хаотичные релизы."
    ),
    ENTERPRISE(
            "MegaCore",
            "Enterprise",
            "🏢",
            "Корпоративный банк. Legacy-монолит + микросервисы, согласования, аудит."
    ),
    EDTECH(
            "LearnHub",
            "EdTech",
            "📚",
            "Онлайн-платформа обучения. Курсы, прогресс студентов, видео-стриминг."
    ),
    MDM(
            "DataSphere",
            "MDM",
            "🗂",
            "Master Data Management: golden record, match-merge, data stewardship."
    ),
    SOCIAL_PLATFORM(
            "Pulse",
            "Social / UGC",
            "📰",
            "Платформа статей и ленты. Event-driven, polyglot persistence."
    ),
    OPEN_BANKING(
            "FinBridge",
            "Open Banking",
            "🏦",
            "PSD2 API: счета, consent, платежи через банки-партнёры."
    ),
    SUPPLY_CHAIN(
            "StockWise",
            "Supply Chain",
            "📦",
            "OMS, склады, резервирование остатков, интеграция с WMS."
    ),
    HEALTHCARE(
            "CareLink",
            "Healthcare",
            "🏥",
            "FHIR API, карты пациентов, encounter, compliance HIPAA."
    ),
    INSURTECH(
            "InsurePro",
            "InsurTech",
            "🛡",
            "Страховые полисы, урегулирование убытков, antifraud rules."
    ),
    IOT_PLATFORM(
            "SensorNet",
            "IoT",
            "📡",
            "Ingest телеметрии, MQTT, stream processing, алерты."
    ),
    LOGISTICS(
            "RouteMaster",
            "Logistics",
            "🚚",
            "TMS, маршруты, гео-сервис, трекинг отправлений."
    ),
    GOVTECH(
            "GovOne",
            "GovTech",
            "🏛",
            "Портал госуслуг, case management, шина к legacy-системам."
    ),
    MEDIA_STREAMING(
            "StreamVault",
            "Media",
            "🎬",
            "Видео-платформа: upload, transcoding, CDN, рекомендации."
    );

    private final String companyName;
    private final String displayName;
    private final String emoji;
    private final String shortDescription;

    ProjectType(String companyName, String displayName, String emoji, String shortDescription) {
        this.companyName = companyName;
        this.displayName = displayName;
        this.emoji = emoji;
        this.shortDescription = shortDescription;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmoji() {
        return emoji;
    }

    public String getShortDescription() {
        return shortDescription;
    }
}
