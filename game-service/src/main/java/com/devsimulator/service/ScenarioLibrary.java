package com.devsimulator.service;

import com.devsimulator.model.GameBalance;
import com.devsimulator.model.CareerTier;
import com.devsimulator.model.Contact;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.ObjectiveType;
import com.devsimulator.model.ScenarioTag;
import com.devsimulator.model.TaskObjective;
import com.devsimulator.model.TaskType;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public final class ScenarioLibrary {

    public static List<Contact> contactsFrom(com.devsimulator.model.ProjectProfile profile) {
        return profile.team().stream()
                .map(t -> new Contact(t.id(), t.name(), t.role(), t.avatar(), "online"))
                .toList();
    }

    public static List<InteractiveTask> createDailyTasks(GameMode mode, int day,
                                                          com.devsimulator.model.ProjectProfile profile,
                                                          int experienceYears) {
        if (mode == GameMode.EXPLORER) {
            return createExplorerDailyTasks(day, profile);
        }
        Random rnd = new Random(day * 9973L + profile.companyName().hashCode() + experienceYears * 17L);
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        List<InteractiveTask> tasks = new ArrayList<>();
        tasks.add(dailyStandupMeeting(profile));

        if (tier == CareerTier.INTERN) {
            tasks.add(DiverseTaskCatalog.pickCoreWorkTask(tier, mode, day, profile, rnd));
            return tasks;
        }

        tasks.add(DiverseTaskCatalog.pickCoreWorkTask(tier, mode, day, profile, rnd));

        if (day >= tier.codeReviewFromDay(mode)) {
            tasks.add(TaskPool.randomCodeReview(profile, rnd));
        }
        if (day >= tier.interviewReviewFromDay(mode)) {
            tasks.add(TaskPool.randomInterviewReview(profile, rnd));
        }

        if (mode == GameMode.REALISTIC || mode == GameMode.CHALLENGE) {
            if (day >= tier.inc501FromDay(mode)) {
                tasks.add(TaskPool.randomProductionIncident(profile, rnd));
            }
            if (day >= tier.inc502FromDay(mode)) {
                tasks.add(TaskPool.randomMemoryLeak(profile, rnd));
            }
            if (day >= tier.kafkaFromDay(mode)) {
                tasks.add(TaskPool.randomKafkaTask(profile, rnd));
            }
        }
        if (day >= tier.featureTaskFromDay(mode)) {
            tasks.add(TaskPool.randomFeatureTask(profile, rnd));
        }
        if (day >= tier.observabilityFromDay(mode)) {
            if (rnd.nextBoolean()) {
                tasks.add(TaskPool.randomObservabilityTask(profile, rnd));
            } else {
                tasks.add(TaskPool.randomSqlTask(profile, rnd));
            }
        }
        if (day >= tier.sqlAnalyticsFromDay(mode) && rnd.nextInt(3) == 0) {
            tasks.add(DiverseTaskCatalog.randomSqlAnalytics(profile, rnd));
        }
        if (day >= tier.troubleshootFromDay(mode)) {
            tasks.add(DiverseTaskCatalog.randomTroubleshoot(profile, rnd));
        }
        if (day >= tier.releaseFromDay(mode) && rnd.nextInt(5) == 0) {
            tasks.add(DiverseTaskCatalog.randomRelease(profile, rnd));
        }
        return tasks;
    }

    private static List<InteractiveTask> createExplorerDailyTasks(int day, com.devsimulator.model.ProjectProfile profile) {
        List<InteractiveTask> tasks = new ArrayList<>();
        tasks.add(dailyStandupMeeting(profile));
        tasks.add(TaskPool.explorerWorkflowTask(profile, day));
        if (day >= 2) {
            tasks.add(TaskPool.explorerReviewTask(profile, day));
        }
        if (day >= 3 && day % 2 == 1) {
            tasks.add(TaskPool.explorerObserveTask(profile, day));
        }
        return tasks;
    }

    private static InteractiveTask dailyStandupMeeting(com.devsimulator.model.ProjectProfile profile) {
        String facilitator = TeamGenerator.facilitatorId(profile);
        List<TaskObjective> objectives = List.of(
                new TaskObjective("obj-standup", ObjectiveType.ATTEND_MEETING,
                        "Посетить Daily Standup (" + GameBalance.standupStartTimeLabel() + ")", facilitator, null, null)
        );
        return new InteractiveTask(
                "MEET-daily",
                "Daily Standup",
                "Командный daily в " + profile.slackChannel() + " — статус по задачам.",
                TaskType.MEETING, ScenarioTag.DAILY_STANDUP, 1, objectives, null, List.of()
        );
    }

    public static List<com.devsimulator.model.ChatMessage> welcomeMessages(
            com.devsimulator.model.ProjectProfile profile, String playerName,
            List<InteractiveTask> tasks, GameMode mode) {
        List<com.devsimulator.model.ChatMessage> messages = new ArrayList<>();
        var lead = profile.team().get(0);
        messages.add(new com.devsimulator.model.ChatMessage(
                "msg-welcome-anna", "anna",
                mention(playerName) + " " + lead.greeting(),
                false, null));
        return messages;
    }

    public static com.devsimulator.model.ChatMessage pr301FollowUpMessage(
            String playerName, String pr301TaskId) {
        return new com.devsimulator.model.ChatMessage(
                "msg-alex-interview", "alex",
                mention(playerName) + " Кстати, PR #301 — классика с собесов: @Transactional на private. "
                        + "Почему rollback не сработает?",
                false, pr301TaskId);
    }

    public static String mention(String playerName) {
        if (playerName == null || playerName.isBlank()) {
            return "@dev";
        }
        String handle = playerName.trim().split("\\s+")[0];
        return "@" + handle;
    }

    public static List<com.devsimulator.model.ChatMessage> initialMessages(
            List<InteractiveTask> tasks, com.devsimulator.model.ProjectProfile profile,
            String playerName, boolean includeWelcome) {
        return initialMessages(tasks, profile, playerName, includeWelcome, 1, GameMode.REALISTIC, 1);
    }

    public static List<com.devsimulator.model.ChatMessage> initialMessages(
            List<InteractiveTask> tasks, com.devsimulator.model.ProjectProfile profile,
            String playerName, boolean includeWelcome, int experienceYears) {
        return initialMessages(tasks, profile, playerName, includeWelcome, experienceYears,
                GameMode.REALISTIC, 1);
    }

    public static List<com.devsimulator.model.ChatMessage> initialMessages(
            List<InteractiveTask> tasks, com.devsimulator.model.ProjectProfile profile,
            String playerName, boolean includeWelcome, int experienceYears,
            GameMode mode, int day) {
        List<com.devsimulator.model.ChatMessage> messages = new ArrayList<>();
        if (includeWelcome && profile != null) {
            messages.addAll(welcomeMessages(profile, playerName, tasks, mode));
            messages.addAll(TeamChannelLibrary.bootstrapFeed(profile, day, mode));
        }
        messages.addAll(taskMessages(tasks, profile, playerName, experienceYears, mode, day));
        return messages;
    }

    private static String standupReminder(int experienceYears) {
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        String timing = GameBalance.standupTimingPhrase(GameBalance.DAY_START_HOUR, 0);
        return switch (tier) {
            case INTERN -> timing + " Расскажи, над чем работаешь — первый день, без стресса 🙂";
            case JUNIOR -> timing + " Коротко: вчера / сегодня / блокеры.";
            default -> timing + " Подготовьте статус по задачам.";
        };
    }

    public static List<com.devsimulator.model.ChatMessage> announceTasks(
            List<InteractiveTask> tasks, com.devsimulator.model.ProjectProfile profile,
            String playerName, int experienceYears) {
        return taskAnnouncementMessages(tasks, profile, playerName, experienceYears);
    }

    private static List<com.devsimulator.model.ChatMessage> taskMessages(
            List<InteractiveTask> tasks, com.devsimulator.model.ProjectProfile profile,
            String playerName, int experienceYears, GameMode mode, int day) {
        List<com.devsimulator.model.ChatMessage> messages = new ArrayList<>(
                taskAnnouncementMessages(tasks, profile, playerName, experienceYears));

        CareerTier tier = CareerTier.fromExperience(experienceYears);
        boolean skipStandupPing = (mode == GameMode.LEARNING || mode == GameMode.RELAXED || mode == GameMode.EXPLORER)
                && day == 1 && tier == CareerTier.INTERN;
        if (!skipStandupPing) {
            String facilitator = TeamGenerator.facilitatorId(profile);
            messages.add(new com.devsimulator.model.ChatMessage(
                    "msg-igor-standup", facilitator,
                    standupReminder(experienceYears),
                    false, null, true));
        }
        return messages;
    }

    private static List<com.devsimulator.model.ChatMessage> taskAnnouncementMessages(
            List<InteractiveTask> tasks, com.devsimulator.model.ProjectProfile profile,
            String playerName, int experienceYears) {
        String at = mention(playerName);
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        List<com.devsimulator.model.ChatMessage> messages = new ArrayList<>();

        for (InteractiveTask task : tasks) {
            switch (task.getScenarioTag()) {
                case JAVA_NPE, JAVA_INDEX_OOB, JAVA_OPTIONAL, JAVA_RESOURCE, JAVA_OFF_BY_ONE,
                     JAVA_STRING_BUILDER, JAVA_EQUALS_NULL, JAVA_PARSE_INT, JAVA_EMPTY_COLLECTION -> {
                    String qaText = tier == CareerTier.INTERN
                            ? at + " Привет! Нашла баг " + task.getTicketId() + " — "
                            + task.getTitle() + ". Не срочно, до конца недели ок 🙏"
                            : at + " " + task.getTicketId() + " — " + task.getTitle() + ". "
                            + (profile != null ? task.getDescription() : "Срочно!") + " 🙏";
                    messages.add(new com.devsimulator.model.ChatMessage(
                            bugMessageId(task.getTicketId()), "maria", qaText,
                            false, task.getId()));
                }
                case CODE_REVIEW_METHOD, CODE_REVIEW_STYLE, CODE_REVIEW_SECURITY -> messages.add(
                        new com.devsimulator.model.ChatMessage(
                                reviewMessageId(task.getTicketId()), "alex",
                                at + " Можешь глянуть " + task.getTicketId() + "? "
                                        + task.getTitle() + " — ссылка в JIRA.",
                                false, task.getId()));
                case EXPLORER_WORKFLOW -> messages.add(new com.devsimulator.model.ChatMessage(
                        bugMessageId(task.getTicketId()), "maria",
                        at + " Привет! " + task.getTicketId() + " — " + task.getTitle()
                                + ". Код писать не нужно: посмотри тикет и ответь, что взял в работу 🙏",
                        false, task.getId()));
                case EXPLORER_REVIEW -> messages.add(new com.devsimulator.model.ChatMessage(
                        reviewMessageId(task.getTicketId()), "alex",
                        at + " Можешь глянуть " + task.getTicketId() + "? "
                                + "Это code review — оцени идею, код править не надо.",
                        false, task.getId()));
                case EXPLORER_OBSERVE -> messages.add(new com.devsimulator.model.ChatMessage(
                        obsMessageId(task.getTicketId()), "igor",
                        at + " " + task.getTicketId() + " — " + task.getTitle()
                                + ". Загляни в Grafana и отчитайся простыми словами.",
                        false, task.getId()));
                case RACE_CONDITION -> messages.add(new com.devsimulator.model.ChatMessage(
                        incMessageId(task.getTicketId()), "dmitry",
                        "🚨 @channel SEV-1 " + task.getTicketId() + "! " + task.getTitle()
                                + " PagerDuty эскалировал. Логи в #war-room",
                        false, task.getId(), true));
                case MEMORY_LEAK -> messages.add(new com.devsimulator.model.ChatMessage(
                        oomMessageId(task.getTicketId()), "dmitry",
                        "🔥 @channel " + task.getTicketId() + ": " + task.getTitle()
                                + " Heap monotonic ↑ — похоже на leak. Grafana JVM Memory → heap dump!",
                        false, task.getId(), true));
                case KAFKA_CONSUMER -> messages.add(new com.devsimulator.model.ChatMessage(
                        kafkaMessageId(task.getTicketId()), "dmitry",
                        "📨 @channel " + task.getTicketId() + ": " + task.getTitle()
                                + " Смотрите Grafana + Kibana.",
                        false, task.getId(), true));
                case METRICS_SLA, SQL_SLOW_QUERY -> messages.add(new com.devsimulator.model.ChatMessage(
                        obsMessageId(task.getTicketId()), "igor",
                        at + " " + task.getTicketId() + " — " + task.getTitle()
                                + ". Проверьте метрики и отчитайтесь.",
                        false, task.getId()));
                case FEATURE_FILTER, FEATURE_PAGINATION, FEATURE_VALIDATION -> messages.add(
                        new com.devsimulator.model.ChatMessage(
                                featureMessageId(task.getTicketId()), "igor",
                                at + " " + task.getTicketId() + " — " + task.getTitle()
                                        + ". ТЗ в JIRA, вопросы — в тред.",
                                false, task.getId()));
                case JAVA_QUIZ -> messages.add(new com.devsimulator.model.ChatMessage(
                        quizMessageId(task.getTicketId()),
                        task.getTicketId().startsWith("QUIZ-10") && tier == CareerTier.INTERN ? "anna" : "alex",
                        at + " " + task.getTicketId() + " — " + task.getTitle()
                                + ". Ответьте кнопкой в Slack (теория Java).",
                        false, task.getId()));
                case SQL_ANALYTICS -> messages.add(new com.devsimulator.model.ChatMessage(
                        sqlAnalyticsMessageId(task.getTicketId()), "igor",
                        at + " " + task.getTicketId() + " — " + task.getTitle()
                                + ". " + sqlAnalyticsSlackHint(task.getTicketId()),
                        false, task.getId()));
                case TROUBLESHOOT_DIAG -> messages.add(new com.devsimulator.model.ChatMessage(
                        troubleshootMessageId(task.getTicketId()), "dmitry",
                        at + " 🔍 " + task.getTicketId() + ": " + task.getTitle()
                                + ". " + troubleshootSlackHint(task.getTicketId()),
                        false, task.getId()));
                case RELEASE_DEPLOY -> messages.add(new com.devsimulator.model.ChatMessage(
                        releaseMessageId(task.getTicketId()), "igor",
                        at + " 🚀 " + task.getTicketId() + " — " + task.getTitle(),
                        false, task.getId()));
                case ALGORITHM_BASICS -> messages.add(new com.devsimulator.model.ChatMessage(
                        algorithmMessageId(task.getTicketId()), "alex",
                        at + " " + task.getTicketId() + " — " + task.getTitle()
                                + " (алгоритмы / LeetCode-style).",
                        false, task.getId()));
                default -> { }
            }
        }
        return messages;
    }

    public static String bugMessageId(String ticketId) {
        return "msg-bug-" + ticketId;
    }

    public static String reviewMessageId(String ticketId) {
        return "msg-review-" + ticketId;
    }

    public static String incMessageId(String ticketId) {
        return "msg-inc-" + ticketId;
    }

    public static String oomMessageId(String ticketId) {
        return "msg-oom-" + ticketId;
    }

    public static String kafkaMessageId(String ticketId) {
        return "msg-kafka-" + ticketId;
    }

    public static String obsMessageId(String ticketId) {
        return "msg-obs-" + ticketId;
    }

    public static String featureMessageId(String ticketId) {
        return "msg-feature-" + ticketId;
    }

    public static String quizMessageId(String ticketId) {
        return "msg-quiz-" + ticketId;
    }

    public static String sqlAnalyticsMessageId(String ticketId) {
        return "msg-sql-an-" + ticketId;
    }

    private static String sqlAnalyticsSlackHint(String ticketId) {
        return switch (ticketId) {
            case "SQL-301" -> "Откройте pgAdmin 🐘 → внизу «HR: зарплаты по отделам» → результат Dmitry в Slack.";
            case "SQL-302" -> "pgAdmin 🐘 → «Бюджет проектов» → overrun Dmitry в Slack.";
            case "SQL-303" -> "pgAdmin 🐘 → «Person: MAX(age)» → итог Dmitry в Slack.";
            case "SQL-304" -> "pgAdmin 🐘 → «Person: дубликаты name+age» → ответ Dmitry в Slack.";
            default -> "SQL в pgAdmin, отчёт Dmitry (DBA) в Slack.";
        };
    }

    public static String troubleshootMessageId(String ticketId) {
        return "msg-tsh-" + ticketId;
    }

    private static String troubleshootSlackHint(String ticketId) {
        if (ticketId == null) {
            return "Slack → инструменты → отчёт Dmitry → JIRA Done.";
        }
        if (isTheoryTsh(ticketId)) {
            return "Теория: прочитайте симптомы → ответьте Dmitry в Slack → JIRA Done.";
        }
        return switch (ticketId) {
            case "TSH-401", "TSH-422", "TSH-426", "TSH-430" ->
                    "Grafana heap → K8s pods → heap dump → Slack → JIRA.";
            case "TSH-402", "TSH-423", "TSH-427" ->
                    "Grafana DB conn → K8s pods → Slack → JIRA.";
            case "TSH-403", "TSH-414", "TSH-424" ->
                    "pgAdmin slow queries → Slack → JIRA.";
            case "TSH-412", "TSH-428" ->
                    "Grafana integration metrics → Slack → JIRA.";
            case "TSH-413" -> "Kafka lag → Slack → JIRA.";
            case "TSH-425" -> "Kafka lag → Grafana → OpenSearch → Slack.";
            case "TSH-417" -> "Prometheus partner-up → Slack → JIRA.";
            case "TSH-418", "TSH-429" -> "Grafana p99 → Slack → JIRA.";
            case "TSH-419" -> "OpenSearch 504 → Slack → JIRA.";
            case "TSH-421" -> "Prometheus p99 query → Slack → JIRA.";
            default -> "Чеклист слева: инструменты → Slack Dmitry → JIRA Done.";
        };
    }

    private static boolean isTheoryTsh(String ticketId) {
        if (!ticketId.startsWith("TSH-")) {
            return false;
        }
        try {
            int n = Integer.parseInt(ticketId.substring(4));
            return n >= 404 && n <= 411;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public static String releaseMessageId(String ticketId) {
        return "msg-rel-" + ticketId;
    }

    public static String algorithmMessageId(String ticketId) {
        return "msg-alg-" + ticketId;
    }

    /** Канонический id Slack-сообщения для чеклиста READ_MESSAGE. */
    public static String primarySlackMessageId(InteractiveTask task) {
        if (task == null || task.getScenarioTag() == null) {
            return task != null ? "msg-task-" + task.getTicketId() : "";
        }
        return switch (task.getScenarioTag()) {
            case JAVA_NPE, JAVA_INDEX_OOB, JAVA_OPTIONAL, JAVA_RESOURCE, JAVA_OFF_BY_ONE,
                 JAVA_STRING_BUILDER, JAVA_EQUALS_NULL, JAVA_PARSE_INT, JAVA_EMPTY_COLLECTION ->
                    bugMessageId(task.getTicketId());
            case CODE_REVIEW_METHOD, CODE_REVIEW_STYLE, CODE_REVIEW_SECURITY ->
                    reviewMessageId(task.getTicketId());
            case RACE_CONDITION -> incMessageId(task.getTicketId());
            case MEMORY_LEAK -> oomMessageId(task.getTicketId());
            case KAFKA_CONSUMER -> kafkaMessageId(task.getTicketId());
            case METRICS_SLA, SQL_SLOW_QUERY -> obsMessageId(task.getTicketId());
            case FEATURE_FILTER, FEATURE_PAGINATION, FEATURE_VALIDATION ->
                    featureMessageId(task.getTicketId());
            case JAVA_QUIZ -> quizMessageId(task.getTicketId());
            case SQL_ANALYTICS -> sqlAnalyticsMessageId(task.getTicketId());
            case TROUBLESHOOT_DIAG -> troubleshootMessageId(task.getTicketId());
            case RELEASE_DEPLOY -> releaseMessageId(task.getTicketId());
            case ALGORITHM_BASICS -> algorithmMessageId(task.getTicketId());
            default -> "msg-task-" + task.getTicketId();
        };
    }

    private ScenarioLibrary() {
    }
}
