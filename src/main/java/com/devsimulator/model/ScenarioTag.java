package com.devsimulator.model;

/** Категория сценария — для пула задач и UI (Grafana, K8s, IntelliJ). */
public enum ScenarioTag {
    DAILY_STANDUP,
    JAVA_NPE,
    JAVA_INDEX_OOB,
    JAVA_OPTIONAL,
    JAVA_RESOURCE,
    JAVA_OFF_BY_ONE,
    JAVA_STRING_BUILDER,
    JAVA_EQUALS_NULL,
    JAVA_PARSE_INT,
    JAVA_EMPTY_COLLECTION,
    RACE_CONDITION,
    MEMORY_LEAK,
    KAFKA_CONSUMER,
    METRICS_SLA,
    SQL_SLOW_QUERY,
    CODE_REVIEW_METHOD,
    CODE_REVIEW_STYLE,
    CODE_REVIEW_SECURITY,
    TRANSACTIONAL_TRAP,
    FEATURE_FILTER,
    FEATURE_PAGINATION,
    FEATURE_VALIDATION,
    GENERIC;

    /** Для старых сохранений без scenarioTag. */
    public static ScenarioTag inferFromTicketId(String ticketId) {
        if (ticketId == null) {
            return GENERIC;
        }
        return switch (ticketId) {
            case "INC-501", "INC-503", "INC-507" -> RACE_CONDITION;
            case "INC-502", "INC-504", "INC-508" -> MEMORY_LEAK;
            case "KAFKA-101", "KAFKA-102", "KAFKA-103" -> KAFKA_CONSUMER;
            case "OBS-101", "OBS-102", "OBS-103" -> METRICS_SLA;
            case "SQL-101", "SQL-102", "SQL-103" -> SQL_SLOW_QUERY;
            case "PR-301", "PR-302", "PR-303" -> TRANSACTIONAL_TRAP;
            case "PR-247", "PR-248", "PR-249" -> CODE_REVIEW_METHOD;
            case "JIRA-201", "JIRA-202" -> FEATURE_FILTER;
            case "MEET-daily" -> DAILY_STANDUP;
            default -> ticketId.startsWith("JIRA-") ? JAVA_NPE : GENERIC;
        };
    }
}
