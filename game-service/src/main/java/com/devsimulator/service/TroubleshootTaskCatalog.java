package com.devsimulator.service;

import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.ObjectiveType;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ReplyOption;
import com.devsimulator.model.ScenarioTag;
import com.devsimulator.model.TaskObjective;
import com.devsimulator.model.TaskType;

import java.util.ArrayList;
import java.util.List;

/** Пул траблшутинг-задач (30+): теория, ops-инструменты, многошаговые расследования. */
public final class TroubleshootTaskCatalog {

    private TroubleshootTaskCatalog() {
    }

    public static List<InteractiveTask> all(ProjectProfile profile) {
        List<InteractiveTask> list = new ArrayList<>(30);
        list.add(tsh401Oom());
        list.add(tsh402Import());
        list.add(tsh403Latency());
        list.add(tsh404Dns());
        list.add(tsh405Ssl());
        list.add(tsh406Redis());
        list.add(tsh407Hikari());
        list.add(tsh408Gc());
        list.add(tsh409ThreadPool());
        list.add(tsh410DiskFull());
        list.add(tsh411BadGateway());
        list.add(tsh412ErrorSpike());
        list.add(tsh413KafkaLag());
        list.add(tsh414SlowSql());
        list.add(tsh415CrashLoop());
        list.add(tsh416OomPods());
        list.add(tsh417PartnerDown());
        list.add(tsh418P99Latency());
        list.add(tsh419Log504());
        list.add(tsh420DbConnections());
        list.add(tsh421PromP99());
        list.add(tsh422OomFull());
        list.add(tsh423ImportFull());
        list.add(tsh424LatencyChain());
        list.add(tsh425KafkaChain());
        list.add(tsh426MemoryChain());
        list.add(tsh427ConnStorm());
        list.add(tsh428Cascade());
        list.add(tsh429PerfRegression());
        list.add(tsh430ProdTriage());
        return list;
    }

    private static List<TaskObjective> readReplyJira(String ticket, String readLabel, String replyLabel, String replyId) {
        return List.of(
                new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                        readLabel, "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                        replyLabel, "dmitry", null, replyId),
                new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA,
                        "JIRA: закрыть " + ticket)
        );
    }

    private static List<TaskObjective> opsReplyJira(
            String ticket, String readLabel, String opsLabel,
            String appId, String actionId, String replyLabel, String replyId) {
        return List.of(
                new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                        readLabel, "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                new TaskObjective("obj-ops-" + ticket, ObjectiveType.CHECK_METRICS,
                        opsLabel, appId, actionId, null),
                new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                        replyLabel, "dmitry", null, replyId),
                new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA,
                        "JIRA: закрыть " + ticket)
        );
    }

    private static InteractiveTask theory(
            String ticket, String title, String desc, int difficulty,
            String readLabel, String replyLabel, String replyId,
            ReplyOption correct, ReplyOption wrong) {
        return new InteractiveTask(ticket, title, desc,
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, difficulty,
                readReplyJira(ticket, readLabel, replyLabel, replyId),
                null, List.of(correct, wrong));
    }

    private static InteractiveTask ops(
            String ticket, String title, String desc, int difficulty, TaskType type,
            String readLabel, String opsLabel, String appId, String actionId,
            String replyLabel, String replyId, ReplyOption correct, ReplyOption wrong) {
        return new InteractiveTask(ticket, title, desc, type, ScenarioTag.TROUBLESHOOT_DIAG, difficulty,
                opsReplyJira(ticket, readLabel, opsLabel, appId, actionId, replyLabel, replyId),
                null, List.of(correct, wrong));
    }

    // ─── Существующие (401–403) ───

    private static InteractiveTask tsh401Oom() {
        String ticket = "TSH-401";
        return new InteractiveTask(ticket, "🔥 OOM / heap leak",
                "Grafana heap ↑ + K8s OOMKilled → heap dump",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack SRE", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: heap monotonic", "grafana", "oom-heap-growth", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: OOMKilled pods", "kubernetes", "oom-pods", null),
                        new TaskObjective("obj-heap-" + ticket, ObjectiveType.HEAP_DUMP,
                                "K8s: heap dump", "kubernetes", "heap-dump", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry: отчёт", "dmitry", null, "tsh-oom-report"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh-oom-report", "Leak в cache map — hotfix", true,
                        "Dmitry: «Hotfix»")));
    }

    private static InteractiveTask tsh402Import() {
        String ticket = "TSH-402";
        return new InteractiveTask(ticket, "🔌 Импорт с шины упал",
                "Conn pool NSI + PG sessions + gateway pods",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 2,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: DB connections", "grafana", "db-connections", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: gateway/backend", "kubernetes", "import-pods", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh-import-report"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh-import-report", "Pool 7/15, PG ok — batch size", true,
                        "Dmitry: «Batch size»")));
    }

    private static InteractiveTask tsh403Latency() {
        String ticket = "TSH-403";
        return ops(ticket, "⏱ Latency 5s→2s",
                "Что мониторить после ускорения SQL?",
                2, TaskType.REFACTORING,
                "Slack DBA", "pgAdmin: slow queries", "postgresql", "pg-slow-queries",
                "Slack → Dmitry", "tsh-latency-report",
                new ReplyOption("tsh-latency-report",
                        "Baseline + locks/GC/Hikari — не регрессировать", true, "Dmitry: «Верно»"),
                new ReplyOption("tsh-latency-wrong", "Достаточно одного EXPLAIN", false,
                        "Dmitry: «Нужен baseline»"));
    }

    // ─── Easy: теория (404–411) ───

    private static InteractiveTask tsh404Dns() {
        return theory("TSH-404", "🌐 502 после деплоя",
                "Сервис не резолвится — с чего начать?",
                1, "Slack → алерт", "Slack → Dmitry: гипотеза", "tsh404-ok",
                new ReplyOption("tsh404-ok", "nslookup/dig + Service endpoints в K8s", true,
                        "Dmitry: «DNS/Service mismatch — классика»"),
                new ReplyOption("tsh404-bad", "Сразу rollback без проверки", false,
                        "Dmitry: «Сначала диагностика»"));
    }

    private static InteractiveTask tsh405Ssl() {
        return theory("TSH-405", "🔒 SSL certificate expired",
                "Клиенты видят ERR_CERT_DATE_INVALID",
                1, "Slack → инцидент", "Slack → Dmitry", "tsh405-ok",
                new ReplyOption("tsh405-ok", "Проверить cert-manager / ingress TLS + дату", true,
                        "Dmitry: «Auto-renew сломался»"),
                new ReplyOption("tsh405-bad", "Перезапустить pod — cert обновится", false,
                        "Dmitry: «Cert на ingress, не в pod»"));
    }

    private static InteractiveTask tsh406Redis() {
        return theory("TSH-406", "🔴 Redis timeout",
                "Session lookup > 3s, Redis latency alert",
                1, "Slack → on-call", "Slack → Dmitry", "tsh406-ok",
                new ReplyOption("tsh406-ok", "Redis INFO + slowlog + network/eviction", true,
                        "Dmitry: «maxmemory-policy»"),
                new ReplyOption("tsh406-bad", "Увеличить timeout в коде", false,
                        "Dmitry: «Root cause в Redis»"));
    }

    private static InteractiveTask tsh407Hikari() {
        return theory("TSH-407", "🏊 HikariCP pool exhausted",
                "Cannot get connection — pool size 10, active 10",
                1, "Slack → алерт", "Slack → Dmitry", "tsh407-ok",
                new ReplyOption("tsh407-ok", "Thread dump + leaked connections + slow queries", true,
                        "Dmitry: «Connection leak в @Transactional»"),
                new ReplyOption("tsh407-bad", "Сразу pool=100", false,
                        "Dmitry: «Masking, не fix»"));
    }

    private static InteractiveTask tsh408Gc() {
        return theory("TSH-408", "♻️ GC pause spikes",
                "STW паузы 800ms каждые 30s",
                1, "Slack → JVM alert", "Slack → Dmitry", "tsh408-ok",
                new ReplyOption("tsh408-ok", "GC log + heap trend + allocation rate", true,
                        "Dmitry: «G1 tuning или leak»"),
                new ReplyOption("tsh408-bad", "Выключить GC logging", false,
                        "Dmitry: «Нужны логи»"));
    }

    private static InteractiveTask tsh409ThreadPool() {
        return theory("TSH-409", "🧵 Thread pool saturation",
                "RejectedExecutionException в checkout-api",
                1, "Slack → error spike", "Slack → Dmitry", "tsh409-ok",
                new ReplyOption("tsh409-ok", "Queue depth + blocked threads + downstream latency", true,
                        "Dmitry: «Backpressure»"),
                new ReplyOption("tsh409-bad", "Увеличить pool до 500", false,
                        "Dmitry: «Downstream bottleneck»"));
    }

    private static InteractiveTask tsh410DiskFull() {
        return theory("TSH-410", "💾 Disk full on node",
                "Pod Evicted — no space left on device",
                1, "Slack → K8s alert", "Slack → Dmitry", "tsh410-ok",
                new ReplyOption("tsh410-ok", "df -h + PVC usage + log rotation", true,
                        "Dmitry: «EmptyDir без limit»"),
                new ReplyOption("tsh410-bad", "Delete random pods", false,
                        "Dmitry: «Освободить диск»"));
    }

    private static InteractiveTask tsh411BadGateway() {
        return theory("TSH-411", "🚪 502 Bad Gateway",
                "Ingress → upstream connection refused",
                1, "Slack → users complain", "Slack → Dmitry", "tsh411-ok",
                new ReplyOption("tsh411-ok", "Ingress logs + Service endpoints + readiness probe", true,
                        "Dmitry: «Pod not ready»"),
                new ReplyOption("tsh411-bad", "502 = проблема DNS всегда", false,
                        "Dmitry: «Чаще upstream down»"));
    }

    // ─── Medium: один ops-шаг (412–421) ───

    private static InteractiveTask tsh412ErrorSpike() {
        return ops("TSH-412", "📈 Error rate spike",
                "5xx вырос с 0.02% до 8% за 10 мин",
                2, TaskType.PRODUCTION_BUG,
                "Slack SRE", "Grafana: integration metrics", "grafana", "integration-metrics",
                "Slack → Dmitry", "tsh412-ok",
                new ReplyOption("tsh412-ok", "payment-gateway 504 — circuit breaker", true, "Dmitry: «Ok»"),
                new ReplyOption("tsh412-bad", "Rollback без метрик", false, "Dmitry: «Нужен root cause»"));
    }

    private static InteractiveTask tsh413KafkaLag() {
        return ops("TSH-413", "📨 Kafka lag 900+",
                "orders.created consumer отстаёт",
                2, TaskType.PRODUCTION_BUG,
                "Slack", "Kafka: consumer lag", "kafka", "consumer-lag",
                "Slack → Dmitry", "tsh413-ok",
                new ReplyOption("tsh413-ok", "Lag 900 — slow handler, не reset offset", true, "Dmitry: «Fix handler»"),
                new ReplyOption("tsh413-bad", "Reset offset на latest", false, "Dmitry: «Потеря данных»"));
    }

    private static InteractiveTask tsh414SlowSql() {
        return ops("TSH-414", "🐘 Slow SQL query",
                "checkout-db CPU 95%, один запрос 4.2s",
                2, TaskType.REFACTORING,
                "Slack DBA", "pgAdmin: slow queries", "postgresql", "pg-slow-queries",
                "Slack → Dmitry", "tsh414-ok",
                new ReplyOption("tsh414-ok", "Seq Scan orders — нужен index на customer_id", true, "Dmitry: «Index»"),
                new ReplyOption("tsh414-bad", "Увеличить CPU DB", false, "Dmitry: «Query plan»"));
    }

    private static InteractiveTask tsh415CrashLoop() {
        return ops("TSH-415", "💥 CrashLoopBackOff",
                "payment-svc рестартует каждые 30s",
                2, TaskType.PRODUCTION_BUG,
                "Slack", "K8s: pod status", "kubernetes", "import-pods",
                "Slack → Dmitry", "tsh415-ok",
                new ReplyOption("tsh415-ok", "CrashLoop — смотреть logs/describe, не rollout blind", true,
                        "Dmitry: «NPE в startup»"),
                new ReplyOption("tsh415-bad", "rollout restart решит", false, "Dmitry: «Config error»"));
    }

    private static InteractiveTask tsh416OomPods() {
        return ops("TSH-416", "☠️ Pod OOMKilled",
                "checkout-api перезапускается — memory limit",
                2, TaskType.PRODUCTION_BUG,
                "Slack", "K8s: OOMKilled", "kubernetes", "oom-pods",
                "Slack → Dmitry", "tsh416-ok",
                new ReplyOption("tsh416-ok", "OOMKilled — heap dump + limit review", true, "Dmitry: «Leak»"),
                new ReplyOption("tsh416-bad", "Увеличить CPU limit", false, "Dmitry: «Memory limit»"));
    }

    private static InteractiveTask tsh417PartnerDown() {
        return ops("TSH-417", "🤝 Partner API down",
                "up{job=\"partner-api\"} = 0",
                2, TaskType.PRODUCTION_BUG,
                "Slack", "Prometheus: partner up", "prometheus", "partner-up",
                "Slack → Dmitry", "tsh417-ok",
                new ReplyOption("tsh417-ok", "Partner down — fallback + status page", true, "Dmitry: «CB open»"),
                new ReplyOption("tsh417-bad", "Retry forever без backoff", false, "Dmitry: «Storm»"));
    }

    private static InteractiveTask tsh418P99Latency() {
        return ops("TSH-418", "⏱ p99 > 2s",
                "SLO breach checkout-api",
                2, TaskType.REFACTORING,
                "Slack PM", "Grafana: p99 dashboard", "grafana", "p99-dashboard",
                "Slack → Dmitry", "tsh418-ok",
                new ReplyOption("tsh418-ok", "p99 2.3s — partner timeout bottleneck", true, "Dmitry: «Async»"),
                new ReplyOption("tsh418-bad", "p99 не важен, смотрим avg", false, "Dmitry: «SLO по p99»"));
    }

    private static InteractiveTask tsh419Log504() {
        return ops("TSH-419", "📋 504 в логах",
                "payment-gateway upstream timeout",
                2, TaskType.PRODUCTION_BUG,
                "Slack", "OpenSearch: 504 errors", "opensearch", "integration-errors",
                "Slack → Dmitry", "tsh419-ok",
                new ReplyOption("tsh419-ok", "504 upstream — timeout/retry policy", true, "Dmitry: «Ok»"),
                new ReplyOption("tsh419-bad", "504 = наш NPE", false, "Dmitry: «Gateway timeout»"));
    }

    private static InteractiveTask tsh420DbConnections() {
        return ops("TSH-420", "🐘 DB connections spike",
                "active sessions 18/20",
                2, TaskType.PRODUCTION_BUG,
                "Slack", "Grafana: DB connections", "grafana", "db-connections",
                "Slack → Dmitry", "tsh420-ok",
                new ReplyOption("tsh420-ok", "Pool near max — leak или long transaction", true, "Dmitry: «Fix leak»"),
                new ReplyOption("tsh420-bad", "max_connections=1000", false, "Dmitry: «Root cause»"));
    }

    private static InteractiveTask tsh421PromP99() {
        return ops("TSH-421", "📊 PromQL p99",
                "histogram_quantile для checkout latency",
                2, TaskType.REFACTORING,
                "Slack", "Prometheus: p99 query", "prometheus", "p99-query",
                "Slack → Dmitry", "tsh421-ok",
                new ReplyOption("tsh421-ok", "histogram_quantile(0.99, rate(...)) = 2.1s", true, "Dmitry: «Ok»"),
                new ReplyOption("tsh421-bad", "avg() достаточно", false, "Dmitry: «Tail latency»"));
    }

    // ─── Hard: цепочки (422–430) ───

    private static InteractiveTask tsh422OomFull() {
        String ticket = "TSH-422";
        return new InteractiveTask(ticket, "🔥 Heap leak — full triage",
                "Prod OOM: Grafana → K8s → dump",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack SRE", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: heap chart", "grafana", "oom-heap-growth", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: OOMKilled", "kubernetes", "oom-pods", null),
                        new TaskObjective("obj-heap-" + ticket, ObjectiveType.HEAP_DUMP,
                                "K8s: heap dump", "kubernetes", "heap-dump", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh422-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh422-ok", "Static Map в EventCache — remove + redeploy", true,
                        "Dmitry: «Hotfix merged»")));
    }

    private static InteractiveTask tsh423ImportFull() {
        String ticket = "TSH-423";
        return new InteractiveTask(ticket, "🔌 NSI import — full triage",
                "Шина + pool + pods",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: DB conn", "grafana", "db-connections", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: import pods", "kubernetes", "import-pods", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh423-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh423-ok", "Batch 500→50, pool recovered", true,
                        "Dmitry: «Import resumed»")));
    }

    private static InteractiveTask tsh424LatencyChain() {
        String ticket = "TSH-424";
        return new InteractiveTask(ticket, "⏱ Latency regression chain",
                "SQL fix → мониторинг tail latency",
                TaskType.REFACTORING, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack DBA", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-pg-" + ticket, ObjectiveType.CHECK_METRICS,
                                "pgAdmin: slow queries", "postgresql", "pg-slow-queries", null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: p99", "grafana", "p99-dashboard", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh424-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh424-ok", "Query 5s→200ms, p99 stable, locks ok", true,
                        "Dmitry: «Baseline saved»")));
    }

    private static InteractiveTask tsh425KafkaChain() {
        String ticket = "TSH-425";
        return new InteractiveTask(ticket, "📨 Kafka stall — full chain",
                "Lag + metrics + logs",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-kafka-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Kafka: lag", "kafka", "consumer-lag", null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: integration", "grafana", "integration-metrics", null),
                        new TaskObjective("obj-os-" + ticket, ObjectiveType.CHECK_METRICS,
                                "OpenSearch: 504", "opensearch", "integration-errors", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh425-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh425-ok", "504 upstream blocks commit — retry+DLQ", true,
                        "Dmitry: «Fixed»")));
    }

    private static InteractiveTask tsh426MemoryChain() {
        String ticket = "TSH-426";
        return new InteractiveTask(ticket, "🧠 Memory investigation",
                "Heap trend + pod status + dump",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: heap", "grafana", "oom-heap-growth", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: pods", "kubernetes", "oom-pods", null),
                        new TaskObjective("obj-heap-" + ticket, ObjectiveType.HEAP_DUMP,
                                "Heap dump", "kubernetes", "heap-dump", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh426-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh426-ok", "SessionDto leak in filter chain", true,
                        "Dmitry: «PR ready»")));
    }

    private static InteractiveTask tsh427ConnStorm() {
        String ticket = "TSH-427";
        return new InteractiveTask(ticket, "🌊 Connection storm",
                "DB pool + gateway pods",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: DB conn", "grafana", "db-connections", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: gateway", "kubernetes", "import-pods", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh427-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh427-ok", "Thundering herd after deploy — rate limit", true,
                        "Dmitry: «Mitigated»")));
    }

    private static InteractiveTask tsh428Cascade() {
        String ticket = "TSH-428";
        return new InteractiveTask(ticket, "⛓ Cascade failure",
                "Partner down → errors → lag",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack SRE", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: errors", "grafana", "integration-metrics", null),
                        new TaskObjective("obj-prom-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Prometheus: partner", "prometheus", "partner-up", null),
                        new TaskObjective("obj-os-" + ticket, ObjectiveType.CHECK_METRICS,
                                "OpenSearch: logs", "opensearch", "integration-errors", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh428-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh428-ok", "Partner outage → CB open → stop retry storm", true,
                        "Dmitry: «Postmortem»")));
    }

    private static InteractiveTask tsh429PerfRegression() {
        String ticket = "TSH-429";
        return new InteractiveTask(ticket, "📉 Perf regression",
                "Release → p99 вырос",
                TaskType.REFACTORING, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack PM", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: p99", "grafana", "p99-dashboard", null),
                        new TaskObjective("obj-prom-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Prometheus: histogram", "prometheus", "p99-query", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry", "dmitry", null, "tsh429-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh429-ok", "N+1 после refactor — revert + fix", true,
                        "Dmitry: «Rollback done»")));
    }

    private static InteractiveTask tsh430ProdTriage() {
        String ticket = "TSH-430";
        return new InteractiveTask(ticket, "🚨 Prod triage — SEV-1",
                "Полный цикл: metrics → pods → dump",
                TaskType.PRODUCTION_BUG, ScenarioTag.TROUBLESHOOT_DIAG, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack SRE", "dmitry", ScenarioLibrary.troubleshootMessageId(ticket), null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana: heap + errors", "grafana", "oom-heap-growth", null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s: OOMKilled", "kubernetes", "oom-pods", null),
                        new TaskObjective("obj-heap-" + ticket, ObjectiveType.HEAP_DUMP,
                                "Heap dump", "kubernetes", "heap-dump", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Slack → Dmitry: RCA", "dmitry", null, "tsh430-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("tsh430-ok",
                        "RCA: unbounded cache + missing TTL — fix deployed", true,
                        "Dmitry: «SEV-1 resolved»")));
    }
}
