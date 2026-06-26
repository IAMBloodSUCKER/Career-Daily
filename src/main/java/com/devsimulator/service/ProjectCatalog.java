package com.devsimulator.service;

import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ProjectType;
import com.devsimulator.model.TeamMemberIntro;

import java.util.List;

public final class ProjectCatalog {

    private ProjectCatalog() {
    }

    public static List<ProjectProfile> all() {
        return List.of(
                ecommerce(),
                fintech(),
                startup(),
                enterprise(),
                edtech(),
                mdm(),
                socialPlatform(),
                openBanking(),
                supplyChain(),
                healthcare(),
                insurtech(),
                iotPlatform(),
                logistics(),
                govtech(),
                mediaStreaming()
        );
    }

    public static ProjectProfile get(ProjectType type) {
        return all().stream()
                .filter(p -> p.type() == type)
                .findFirst()
                .orElse(ecommerce());
    }

    private static ProjectProfile ecommerce() {
        return new ProjectProfile(
                ProjectType.E_COMMERCE,
                "ShopFlow",
                "ShopFlow Marketplace",
                "Маркетплейс нового поколения",
                "ShopFlow — крупный маркетплейс с 2M+ пользователей. Вы в команде Checkout: "
                        + "оформление заказов, оплата, интеграция с доставкой. "
                        + "Стек: Java 17, Spring Boot 3, PostgreSQL, Kafka, Redis.",
                List.of("Java 17", "Spring Boot 3", "PostgreSQL", "Kafka", "Redis", "JUnit 5"),
                "Микросервисы: order-service, payment-service, catalog-service. "
                        + "Общение через REST и Kafka. CI/CD — GitLab.",
                "Junior Java Developer в команде Checkout",
                teamEcommerce(),
                "#team-checkout",
                introSteps(
                        "Добро пожаловать в ShopFlow! Сегодня ваш первый рабочий день.",
                        "Команда Checkout отвечает за путь пользователя от корзины до оплаты.",
                        "Первые задачи уже ждут в JIRA — начните со Slack."
                )
        );
    }

    private static ProjectProfile fintech() {
        return new ProjectProfile(
                ProjectType.FINTECH,
                "PaySecure",
                "PaySecure Gateway",
                "Платежи без компромиссов",
                "PaySecure обрабатывает 50K транзакций в минуту. Любой баг в payment-service "
                        + "— потерянные деньги и штрафы регулятора. "
                        + "Стек: Java 17, Spring Boot, Oracle DB, Hazelcast, строгий code review.",
                List.of("Java 17", "Spring Boot", "Oracle DB", "Hazelcast", "PCI DSS", "SonarQube"),
                "Монолит payment-core + satellite-сервисы. Zero-downtime deploys. "
                        + "Обязательный 4-eyes review на prod.",
                "Junior Developer в Payment Core",
                teamFintech(),
                "#payment-core",
                introSteps(
                        "PaySecure — высоконагруженный FinTech. Здесь цена ошибки максимальна.",
                        "Ваш наставник — Алексей. Все изменения проходят через code review.",
                        "Сегодня возможен hotfix — будьте на связи в Slack."
                )
        );
    }

    private static ProjectProfile startup() {
        return new ProjectProfile(
                ProjectType.STARTUP,
                "QuickLaunch",
                "QuickLaunch SaaS",
                "Ship fast, learn faster",
                "QuickLaunch — B2B SaaS стартап, 15 человек. Нет бюрократии: "
                        + "деплойте сами, митингов минимум, зато дедлайны горят. "
                        + "Стек: Java 21, Spring Boot, MongoDB, Docker на одном VPS.",
                List.of("Java 21", "Spring Boot", "MongoDB", "Docker", "GitHub Actions"),
                "Один backend-repo, feature flags, deploy 3 раза в неделю. "
                        + "Тесты пишем по мере сил.",
                "Full-stack oriented Java Developer",
                teamStartup(),
                "#dev-random",
                introSteps(
                        "QuickLaunch — стартап. Здесь вы быстро растёте, но и стресс выше.",
                        "Игорь (PM) сам пишет в Slack в 23:00 — это норма.",
                        "Первый баг уже в prod. Добро пожаловать!"
                )
        );
    }

    private static ProjectProfile enterprise() {
        return new ProjectProfile(
                ProjectType.ENTERPRISE,
                "MegaCore",
                "MegaBank Core System",
                "Legacy meets microservices",
                "MegaBank — система с 20-летней историей. Вы работаете над миграцией "
                        + "legacy-монолита на микросервисы. Много согласований, документации и митингов. "
                        + "Стек: Java 17, Spring, IBM MQ, DB2, Jenkins.",
                List.of("Java 17", "Spring", "DB2", "IBM MQ", "Jenkins", "Confluence"),
                "Legacy EAR + новые Spring Boot сервисы. Архитектурный комитет одобряет каждый PR.",
                "Junior Developer в программе модернизации",
                teamEnterprise(),
                "#core-modernization",
                introSteps(
                        "MegaBank — enterprise-масштаб. Процессы строгие, но опыт бесценный.",
                        "Анна — ваш Team Lead. Все задачи через JIRA и change request.",
                        "Сегодня stand-up, planning и, возможно, audit-вопросы."
                )
        );
    }

    private static ProjectProfile edtech() {
        return new ProjectProfile(
                ProjectType.EDTECH,
                "LearnHub",
                "LearnHub Platform",
                "Обучение для миллионов",
                "LearnHub — платформа онлайн-курсов. Вы в команде Progress API: "
                        + "отслеживание прогресса, сертификаты, интеграция с видео. "
                        + "Стек: Java 17, Spring Boot, PostgreSQL, Elasticsearch.",
                List.of("Java 17", "Spring Boot", "PostgreSQL", "Elasticsearch", "Redis"),
                "Сервисы: course-service, progress-service, certificate-service. "
                        + "Пиковая нагрузка — воскресенье вечером (дедлайны курсов).",
                "Junior Java Developer в Progress Team",
                teamEdtech(),
                "#team-progress",
                introSteps(
                        "LearnHub — EdTech с сезонными пиками нагрузки.",
                        "Мария (QA) тестирует каждый релиз на реальных студентах.",
                        "Первая задача — баг в progress API. Удачи!"
                )
        );
    }

    private static ProjectProfile mdm() {
        return new ProjectProfile(
                ProjectType.MDM,
                "DataSphere",
                "DataSphere MDM Hub",
                "Single source of truth",
                "DataSphere — корпоративный MDM: golden record для клиентов и продуктов. "
                        + "Вы в команде Match & Merge: дедупликация, stewardship, публикация в Kafka. "
                        + "Стек: Java 17, Spring Boot, PostgreSQL, Kafka, Drools.",
                List.of("Java 17", "Spring Boot", "PostgreSQL", "Kafka", "Drools", "Debezium"),
                "Микросервисы: ingestion-api, match-service, mdm-core, stewardship-ui. "
                        + "События golden_record.updated → CRM, DWH, billing.",
                "Junior Java Developer в MDM Core",
                teamFor("#mdm-core",
                        "8 лет в data governance. Golden record — святое.",
                        "Match-merge алгоритмы и Kafka outbox.",
                        "Тестирует merge-сценарии на копиях prod-данных.",
                        "Data owner из бизнеса. SLA на качество данных.",
                        "CDC из source systems, мониторинг lag."),
                "#mdm-core",
                introSteps(
                        "DataSphere — здесь ошибка в master data ломает все downstream-системы.",
                        "Первый тикет — false-positive merge в customer golden record.",
                        "Начните со Slack и схемы в Confluence."
                )
        );
    }

    private static ProjectProfile socialPlatform() {
        return new ProjectProfile(
                ProjectType.SOCIAL_PLATFORM,
                "Pulse",
                "Pulse Publishing",
                "Read · Write · Feed",
                "Pulse — платформа статей и соцленты (аналог Medium). "
                        + "Вы в article-service: сохранение постов, Kafka-события, polyglot persistence. "
                        + "Стек: Java 21, Spring Boot, Cassandra, Kafka, OpenSearch, Neo4j.",
                List.of("Java 21", "Spring Boot", "Cassandra", "Kafka", "OpenSearch", "Neo4j"),
                "article-service → Cassandra; search-service → OpenSearch; "
                        + "feed-service + followers-service (Neo4j) → PostgreSQL ленты.",
                "Junior Java Developer в Article Team",
                teamFor("#team-article",
                        "Бывший Staff в big tech. Event-driven only.",
                        "Автор feed/search pipeline. Review за час.",
                        "Нагрузочное на Cassandra и consumer lag.",
                        "DAU и time-on-feed — главные метрики.",
                        "Consumer groups, lag alerts в Grafana."),
                "#team-article",
                introSteps(
                        "Pulse — классическая event-driven архитектура.",
                        "Сегодня баг в Save Article — лента не обновляется.",
                        "Смотрите диаграмму потока в onboarding."
                )
        );
    }

    private static ProjectProfile openBanking() {
        return new ProjectProfile(
                ProjectType.OPEN_BANKING,
                "FinBridge",
                "FinBridge Open API",
                "PSD2 · AIS · PIS",
                "FinBridge — агрегатор open banking для EU. Consent, account information, payment initiation. "
                        + "Стек: Java 17, Spring Security, OAuth2, PostgreSQL, bank adapters.",
                List.of("Java 17", "Spring Security", "OAuth2", "PostgreSQL", "gRPC", "Redis"),
                "API Gateway → consent-service → account/payment-service → bank-connector (per bank). "
                        + "Audit log immutable в отдельном сервисе.",
                "Junior Developer в Payment Initiation",
                teamFor("#open-api",
                        "Compliance-first. Каждый endpoint под аудитом.",
                        "mTLS и JWT между сервисами — его зона.",
                        "Pen-test раз в квартал.",
                        "PSD2 roadmap и bank onboarding.",
                        "Cert rotation и HSM интеграция."),
                "#open-api",
                introSteps(
                        "FinBridge — регулятор смотрит в каждый PR.",
                        "Баг в consent flow блокирует payment initiation.",
                        "Документация API — в Swagger и Confluence."
                )
        );
    }

    private static ProjectProfile supplyChain() {
        return new ProjectProfile(
                ProjectType.SUPPLY_CHAIN,
                "StockWise",
                "StockWise OMS",
                "Inventory · WMS · Fulfill",
                "StockWise — order management для ритейла: резерв остатков, аллокация со складов, "
                        + "интеграция с WMS партнёров. Java 17, Spring, PostgreSQL, Redis, RabbitMQ.",
                List.of("Java 17", "Spring Boot", "PostgreSQL", "Redis", "RabbitMQ", "Resilience4j"),
                "oms-service → inventory-service (Redis lock) → warehouse-adapter → WMS API. "
                        + "Saga на отмену заказа.",
                "Junior Java Developer в OMS Team",
                teamFor("#oms-team",
                        "Ex-Amazon SC. Идемпотентность — не обсуждается.",
                        "Saga orchestration и outbox pattern.",
                        "Интеграционные тесты с mock WMS.",
                        "OTIF — on-time in-full metric.",
                        "Black Friday — freeze deploys."),
                "#oms-team",
                introSteps(
                        "StockWise — пик на распродажах.",
                        "Сегодня race condition при резерве остатков.",
                        "Проверьте Grafana inventory lag."
                )
        );
    }

    private static ProjectProfile healthcare() {
        return new ProjectProfile(
                ProjectType.HEALTHCARE,
                "CareLink",
                "CareLink FHIR Platform",
                "Patients · Encounters · HIPAA",
                "CareLink — FHIR R4 платформа для клиник. Patient, Encounter, Observation resources. "
                        + "Стек: Java 17, HAPI FHIR, Spring Boot, PostgreSQL, audit Kafka.",
                List.of("Java 17", "HAPI FHIR", "Spring Boot", "PostgreSQL", "Kafka", "Keycloak"),
                "FHIR Gateway → patient/encounter-service → PostgreSQL + audit-event-service → SIEM.",
                "Junior Java Developer в FHIR API Team",
                teamFor("#fhir-api",
                        "Клинический background + engineering.",
                        "FHIR profiling и validation rules.",
                        "HIPAA regression suite.",
                        "Epic/Cerner integration roadmap.",
                        "PHI encryption at rest/in transit."),
                "#fhir-api",
                introSteps(
                        "CareLink — PHI нельзя логировать.",
                        "Баг в Patient/$everything bundle.",
                        "Все access — через break-glass audit."
                )
        );
    }

    private static ProjectProfile insurtech() {
        return new ProjectProfile(
                ProjectType.INSURTECH,
                "InsurePro",
                "InsurePro Claims",
                "Policy · Claims · Fraud",
                "InsurePro — страховой InsurTech: полисы, FNOL, урегулирование убытков, rules engine. "
                        + "Java 17, Spring, MongoDB (claims), PostgreSQL (policies), Drools.",
                List.of("Java 17", "Spring Boot", "MongoDB", "PostgreSQL", "Drools", "Camunda"),
                "claim-service → policy-service → fraud-scoring → document-service (S3). "
                        + "BPMN для сложных кейсов.",
                "Junior Java Developer в Claims Team",
                teamFor("#claims-dev",
                        "20 лет в страховании. Process > speed.",
                        "Rules engine и Camunda flows.",
                        "UAT с реальными adjusters.",
                        "Loss ratio и fraud rate KPI.",
                        "SOX-compliant deploy windows."),
                "#claims-dev",
                introSteps(
                        "InsurePro — claim lifecycle длинный, но SLA жёсткий.",
                        "Первый тикет — NPE в claim submission.",
                        "Camunda diagram в Confluence."
                )
        );
    }

    private static ProjectProfile iotPlatform() {
        return new ProjectProfile(
                ProjectType.IOT_PLATFORM,
                "SensorNet",
                "SensorNet IoT Cloud",
                "Ingest · Stream · Alert",
                "SensorNet — платформа IoT: миллионы устройств, MQTT ingest, stream processing, алерты. "
                        + "Java 17, Spring, Kafka, TimescaleDB, Grafana.",
                List.of("Java 17", "Spring Boot", "Kafka", "MQTT", "TimescaleDB", "Flink"),
                "mqtt-gateway → ingest-service → Kafka → stream-processor → TimescaleDB + alert-service.",
                "Junior Java Developer в Ingest Team",
                teamFor("#iot-ingest",
                        "Ex-Telecom IoT. Throughput is king.",
                        "Backpressure и dead letter topics.",
                        "Chaos tests на broker failover.",
                        "Device firmware rollout coordination.",
                        "On-call при broker red status."),
                "#iot-ingest",
                introSteps(
                        "SensorNet — 50K msg/sec в пике.",
                        "Consumer lag на telemetry topic.",
                        "MQTT auth rotation в Vault."
                )
        );
    }

    private static ProjectProfile logistics() {
        return new ProjectProfile(
                ProjectType.LOGISTICS,
                "RouteMaster",
                "RouteMaster TMS",
                "Routes · Fleet · Track",
                "RouteMaster — TMS для грузоперевозок: маршруты, геокодинг, трекинг, ETA. "
                        + "Java 17, Spring, Neo4j (граф дорог), PostgreSQL, Kafka.",
                List.of("Java 17", "Spring Boot", "Neo4j", "PostgreSQL", "Kafka", "PostGIS"),
                "tms-api → route-service → geo-service (PostGIS) → graph (Neo4j) → notification via Kafka.",
                "Junior Java Developer в Routing Team",
                teamFor("#routing",
                        "OR-Tools и графы — её страсть.",
                        "Geo indexing и ETA prediction.",
                        "Field tests с водителями.",
                        "Fuel cost optimization KPI.",
                        "Maps API quota monitoring."),
                "#routing",
                introSteps(
                        "RouteMaster — опоздание рейса = штраф клиенту.",
                        "Баг в ETA calculation на multi-stop.",
                        "Neo4j schema — в Confluence."
                )
        );
    }

    private static ProjectProfile govtech() {
        return new ProjectProfile(
                ProjectType.GOVTECH,
                "GovOne",
                "GovOne Citizen Portal",
                "Cases · ESB · Legacy",
                "GovOne — портал госуслуг: заявления, case management, интеграция с legacy через ESB. "
                        + "Java 17, Spring, IBM Integration Bus, PostgreSQL, document archive.",
                List.of("Java 17", "Spring Boot", "PostgreSQL", "IBM MQ", "Camunda", "MinIO"),
                "portal-api → case-service → esb-adapter → mainframe/legacy + document-service.",
                "Junior Java Developer в Case Management",
                teamFor("#case-mgmt",
                        "15 лет в госсекторе. Change request обязателен.",
                        "ESB mapping и idempotent adapters.",
                        "Accessibility WCAG 2.1 checks.",
                        "Citizen satisfaction index.",
                        "Deploy только в maintenance window."),
                "#case-mgmt",
                introSteps(
                        "GovOne — процессы формальные, но миссия важная.",
                        "Заявление зависло в ESB dead letter.",
                        "Runbook в Confluence — ваш друг."
                )
        );
    }

    private static ProjectProfile mediaStreaming() {
        return new ProjectProfile(
                ProjectType.MEDIA_STREAMING,
                "StreamVault",
                "StreamVault Media",
                "Upload · Transcode · CDN",
                "StreamVault — видео-платформа: upload, transcoding pipeline, metadata, CDN URLs, рекомендации. "
                        + "Java 17, Spring, S3, Cassandra, Kafka, FFmpeg workers.",
                List.of("Java 17", "Spring Boot", "S3", "Cassandra", "Kafka", "Kubernetes"),
                "upload-api → transcode-orchestrator → worker pool → S3 + catalog-service → recommendation Kafka.",
                "Junior Java Developer в Media Pipeline",
                teamFor("#media-pipeline",
                        "Ex-Netflix pipeline engineer.",
                        "Chunked upload и resume.",
                        "Visual QA на 4K transcodes.",
                        "Watch time и buffering ratio.",
                        "CDN purge и origin failover."),
                "#media-pipeline",
                introSteps(
                        "StreamVault — premiere night = no deploy.",
                        "Баг: transcode job застревает в pending.",
                        "Pipeline diagram — в onboarding."
                )
        );
    }

    private static List<TeamMemberIntro> teamFor(String channel,
                                                  String annaBio, String alexBio, String mariaBio,
                                                  String igorBio, String dmitryBio) {
        return List.of(
                member("anna", "Анна С.", "Team Lead", "👩‍💼", annaBio,
                        "Добро пожаловать! Пиши в " + channel + "."),
                member("alex", "Алексей В.", "Senior Java Dev", "👨‍💻", alexBio,
                        "Привет! Помогу разобраться в архитектуре."),
                member("maria", "Мария К.", "QA Engineer", "🧪", mariaBio,
                        "Привет! Баг-репорты с шагами воспроизведения, пожалуйста."),
                member("igor", "Игорь П.", "Product Manager", "📋", igorBio,
                        "Рад видеть в команде!"),
                member("dmitry", "Дмитрий Л.", "DevOps", "🔧", dmitryBio,
                        "Если prod горит — тегай меня в Slack.")
        );
    }

    private static List<TeamMemberIntro> teamEcommerce() {
        return List.of(
                member("anna", "Анна С.", "Team Lead", "👩‍💼",
                        "8 лет в e-commerce. Требовательная, но справедливая.",
                        "Добро пожаловать в Checkout! Я Anna, твой TL. Если что — пиши."),
                member("alex", "Алексей В.", "Senior Java Dev", "👨‍💻",
                        "Архитектор checkout-flow. Любит чистый код и хорошие PR.",
                        "Привет! Я помогу с первыми задачами. Не стесняйся спрашивать."),
                member("maria", "Мария К.", "QA Engineer", "🧪",
                        "Находит баги раньше prod. Пишет лучшие bug reports.",
                        "Привет! Я Maria из QA. Если что-то сломается — я первая узнаю 😄"),
                member("igor", "Игорь П.", "Product Manager", "📋",
                        "Ориентирован на метрики конверсии checkout.",
                        "Рад видеть в команде! Checkout — наш главный revenue driver."),
                member("dmitry", "Дмитрий Л.", "DevOps", "🔧",
                        "Дежурит по PagerDuty. Grafana — его второй дом.",
                        "Йо. Если prod горит — пиши в #war-room.")
        );
    }

    private static List<TeamMemberIntro> teamFintech() {
        return List.of(
                member("anna", "Анна С.", "Engineering Manager", "👩‍💼",
                        "Бывший auditor. Безопасность превыше скорости.",
                        "Welcome to PaySecure. Compliance — не optional."),
                member("alex", "Алексей В.", "Staff Engineer", "👨‍💻",
                        "15 лет в FinTech. Знает PCI DSS наизусть.",
                        "Привет. Здесь каждая строка кода — ответственность."),
                member("maria", "Мария К.", "QA / Security", "🧪",
                        "Pen-test и regression. Не пропускает уязвимости.",
                        "Привет! Буду проверять твои фиксы особенно тщательно."),
                member("igor", "Игорь П.", "Product Owner", "📋",
                        "Балансирует фичи и regulatory requirements.",
                        "Добро пожаловать. Uptime — наш KPI #1."),
                member("dmitry", "Дмитрий Л.", "SRE / DevOps", "🔧",
                        "On-call 24/7. Hotfix за 15 минут или эскалация.",
                        "SEV-1 — не шутка. Держи телефон рядом.")
        );
    }

    private static List<TeamMemberIntro> teamStartup() {
        return List.of(
                member("anna", "Анна С.", "CTO & Co-founder", "👩‍💼",
                        "Бывший FAANG. Кодит сама, когда надо.",
                        "Hey! Мы маленькие — значит, твой вклад сразу виден."),
                member("alex", "Алексей В.", "Lead Dev", "👨‍💻",
                        "Единственный senior. Review за 10 минут или никак.",
                        "Привет! Ship fast, но не ломай prod."),
                member("maria", "Мария К.", "QA (part-time)", "🧪",
                        "Приходит 3 дня в неделю. Остальное — dev тестирует.",
                        "Привет! Автотестов мало — проверяй руками."),
                member("igor", "Игорь П.", "CEO / PM", "📋",
                        "Пишет в Slack ночью. Всегда «срочно».",
                        "Добро пожаловать! MVP не ждёт."),
                member("dmitry", "Дмитрий Л.", "DevOps (ты сам)", "🔧",
                        "На самом деле деплоит Alex. Dmitry — консультант.",
                        "Если упало — смотри логи в Docker.")
        );
    }

    private static List<TeamMemberIntro> teamEnterprise() {
        return List.of(
                member("anna", "Анна С.", "Team Lead", "👩‍💼",
                        "20 лет в банке. Знает legacy лучше документации.",
                        "Добро пожаловать в программу модернизации."),
                member("alex", "Алексей В.", "Principal Engineer", "👨‍💻",
                        "Автор half of the monolith. Review строгий.",
                        "Привет. Legacy — не враг, но уважай его."),
                member("maria", "Мария К.", "QA Lead", "🧪",
                        "UAT, regression, sign-off. Процесс длинный.",
                        "Каждый релиз — checklist на 200 пунктов."),
                member("igor", "Игорь П.", "Business Analyst", "📋",
                        "Мост между бизнесом и IT. Любит митинги.",
                        "Welcome! Change request #4521 ждёт approval."),
                member("dmitry", "Дмитрий Л.", "Infrastructure", "🔧",
                        "Change window: вторник 02:00–04:00.",
                        "Prod deploy — только по расписанию.")
        );
    }

    private static List<TeamMemberIntro> teamEdtech() {
        return List.of(
                member("anna", "Анна С.", "Team Lead", "👩‍💼",
                        "EdTech 6 лет. Заботится о work-life balance команды.",
                        "Добро пожаловать в Progress Team!"),
                member("alex", "Алексей В.", "Senior Java Dev", "👨‍💻",
                        "Elasticsearch и streaming. Mentor по Java.",
                        "Привет! Спроси про Streams — объясню."),
                member("maria", "Мария К.", "QA Engineer", "🧪",
                        "Тестирует на staging с реальными курсами.",
                        "Привет! Студенты находят баги быстрее нас 😅"),
                member("igor", "Игорь П.", "Product Manager", "📋",
                        "Следит за completion rate курсов.",
                        "Рад видеть! Progress API — сердце платформы."),
                member("dmitry", "Дмитрий Л.", "DevOps", "🔧",
                        "Автоскейлинг на воскресные пики.",
                        "Воскресенье 20:00 — не планируй релиз.")
        );
    }

    private static TeamMemberIntro member(String id, String name, String role, String avatar,
                                          String bio, String greeting) {
        return new TeamMemberIntro(id, name, role, avatar, bio, greeting);
    }

    private static List<String> introSteps(String... steps) {
        return List.of(steps);
    }
}
