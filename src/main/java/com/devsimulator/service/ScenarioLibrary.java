package com.devsimulator.service;

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
        Random rnd = new Random(day * 9973L + profile.companyName().hashCode() + experienceYears * 17L);
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        List<InteractiveTask> tasks = new ArrayList<>();
        tasks.add(dailyStandupMeeting(profile));

        if (tier == CareerTier.INTERN) {
            tasks.add(TaskPool.randomInternJavaBug(profile, rnd));
            return tasks;
        }

        tasks.add(TaskPool.randomJavaBug(profile, rnd));

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
        return tasks;
    }

    private static InteractiveTask dailyStandupMeeting(com.devsimulator.model.ProjectProfile profile) {
        String facilitator = TeamGenerator.facilitatorId(profile);
        List<TaskObjective> objectives = List.of(
                new TaskObjective("obj-standup", ObjectiveType.ATTEND_MEETING,
                        "Посетить Daily Standup (09:00)", facilitator, null, null)
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
        messages.add(new com.devsimulator.model.ChatMessage(
                "msg-welcome-channel", TeamGenerator.facilitatorId(profile),
                "Канал команды: " + profile.slackChannel() + ". "
                        + "Продукт: " + profile.productName() + ". "
                        + profile.introSteps().get(1),
                false, null));
        if (mode != GameMode.LEARNING && mode != GameMode.RELAXED) {
            for (var member : profile.team()) {
                if (!member.id().equals("anna")) {
                    if ("alex".equals(member.id()) && hasCodeReviewTask(tasks)) {
                        continue;
                    }
                    messages.add(new com.devsimulator.model.ChatMessage(
                            "msg-welcome-" + member.id(), member.id(),
                            member.greeting(),
                            false, null));
                }
            }
        }
        return messages;
    }

    private static boolean hasCodeReviewTask(List<InteractiveTask> tasks) {
        return tasks.stream().anyMatch(t -> t.getScenarioTag() == ScenarioTag.CODE_REVIEW_METHOD
                || t.getScenarioTag() == ScenarioTag.CODE_REVIEW_STYLE
                || t.getScenarioTag() == ScenarioTag.CODE_REVIEW_SECURITY);
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
        }
        messages.addAll(taskMessages(tasks, profile, playerName, experienceYears, mode, day));
        return messages;
    }

    private static String standupReminder(int experienceYears) {
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        return switch (tier) {
            case INTERN -> "Daily через 10 минут. Расскажи, над чем работаешь — это твой первый день, без стресса 🙂";
            case JUNIOR -> "Daily через 10 минут. Коротко: вчера / сегодня / блокеры.";
            default -> "Daily через 10 минут. Подготовьте статус по задачам.";
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
        boolean skipStandupPing = (mode == GameMode.LEARNING || mode == GameMode.RELAXED)
                && day == 1 && tier == CareerTier.INTERN;
        if (!skipStandupPing) {
            String facilitator = TeamGenerator.facilitatorId(profile);
            messages.add(new com.devsimulator.model.ChatMessage(
                    "msg-igor-standup", facilitator,
                    standupReminder(experienceYears),
                    false, null));
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
                            "msg-bug-" + task.getTicketId(), "maria", qaText,
                            false, task.getId()));
                }
                case CODE_REVIEW_METHOD, CODE_REVIEW_STYLE, CODE_REVIEW_SECURITY -> messages.add(
                        new com.devsimulator.model.ChatMessage(
                                "msg-review-" + task.getTicketId(), "alex",
                                at + " Можешь глянуть " + task.getTicketId() + "? "
                                        + task.getTitle() + " — ссылка в JIRA.",
                                false, task.getId()));
                case RACE_CONDITION -> messages.add(new com.devsimulator.model.ChatMessage(
                        "msg-inc-" + task.getTicketId(), "dmitry",
                        "🚨 @channel SEV-1 " + task.getTicketId() + "! " + task.getTitle()
                                + " PagerDuty эскалировал. Логи в #war-room",
                        false, task.getId()));
                case MEMORY_LEAK -> messages.add(new com.devsimulator.model.ChatMessage(
                        "msg-oom-" + task.getTicketId(), "dmitry",
                        "🔥 " + task.getTicketId() + ": " + task.getTitle()
                                + " Heap monotonic ↑ — похоже на leak. Grafana JVM Memory → heap dump!",
                        false, task.getId()));
                case KAFKA_CONSUMER -> messages.add(new com.devsimulator.model.ChatMessage(
                        "msg-kafka-" + task.getTicketId(), "dmitry",
                        "📨 " + task.getTicketId() + ": " + task.getTitle()
                                + " Смотрите Grafana + Kibana.",
                        false, task.getId()));
                case METRICS_SLA, SQL_SLOW_QUERY -> messages.add(new com.devsimulator.model.ChatMessage(
                        "msg-obs-" + task.getTicketId(), "igor",
                        at + " " + task.getTicketId() + " — " + task.getTitle()
                                + ". Проверьте метрики и отчитайтесь.",
                        false, task.getId()));
                default -> { }
            }
        }
        return messages;
    }

    private ScenarioLibrary() {
    }
}
