package com.devsimulator.service;

import com.devsimulator.model.EmailMessage;
import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ScenarioTag;

import java.util.ArrayList;
import java.util.List;

public final class EmailLibrary {

    public static List<EmailMessage> createInbox(List<InteractiveTask> tasks,
                                                  ProjectProfile profile,
                                                  String playerName, int day) {
        List<EmailMessage> emails = new ArrayList<>();
        String name = playerName != null ? playerName : "Developer";

        emails.add(new EmailMessage(
                "email-hr-welcome",
                "HR @ " + profile.companyName(),
                "Welcome aboard — " + name,
                "Доступы: Slack, JIRA, GitLab, K8s prod (read-only), Kafka, Grafana, Vault.\n"
                        + "Onboarding checklist в Confluence.",
                "hr", null));

        emails.add(new EmailMessage(
                "email-jira-digest",
                "JIRA",
                "Daily digest — Sprint backlog",
                "Открытые тикеты привязаны к вашему профилю. "
                        + "Статус синхронизируется с GitLab MR и GitHub PR.",
                "jira", findFirstJavaBugTaskId(tasks)));

        emails.add(new EmailMessage(
                "email-gitlab-pipeline",
                "GitLab CI",
                "Pipeline #4821 failed — checkout-api",
                "Stage: integration-test (K8s)\n"
                        + "3 tests failed: CheckoutFlowIT, PaymentRaceIT, KafkaConsumerIT\n"
                        + "Логи: https://gitlab." + profile.companyName().toLowerCase().replace(" ", "")
                        + "/checkout-api/-/jobs/4821",
                "gitlab", null));

        emails.add(new EmailMessage(
                "email-recruiter-faang",
                "Sarah Chen · Meta Recruiting",
                "Senior Backend Engineer — $280k+ TC",
                "Привет! Видела ваш профиль на LinkedIn. Meta ищет Java/Kafka инженера.\n"
                        + "Готовы обсудить relocation? Ответьте до пятницы.",
                "recruiter", null));

        emails.add(new EmailMessage(
                "email-recruiter-startup",
                "Alex · Stealth Startup",
                "CTO role — equity 1.5%",
                "Мы делаем fintech на K8s. Нужен человек, который умеет Grafana + incident response.\n"
                        + "Созвон в среду?",
                "recruiter", null));

        emails.add(new EmailMessage(
                "email-spam-crypto",
                "blockchain-nft@mail.ru",
                "🚀 URGENT: Verify wallet NOW",
                "Your account will be suspended. Click here to verify seed phrase…",
                "spam", null));

        emails.add(new EmailMessage(
                "email-scam-phishing",
                "IT-Support <it-support@paypa1.com>",
                "Action required: password expired",
                "Dear employee, your corporate password expires today.\n"
                        + "Login: https://paypa1-security.com/login (NOT official domain!)",
                "scam", null));

        if (findTaskIdByTag(tasks, ScenarioTag.MEMORY_LEAK) != null) {
            String tid = findTaskIdByTag(tasks, ScenarioTag.MEMORY_LEAK);
            InteractiveTask t = tasks.stream().filter(x -> x.getId().equals(tid)).findFirst().orElse(null);
            String ticket = t != null ? t.getTicketId() : "INC-502";
            emails.add(new EmailMessage(
                    "email-dmitry-oom",
                    "Dmitry · DevOps",
                    "🔥 " + ticket + " — OOMKilled checkout-api",
                    "Pod убит OOMKiller. Heap растёт монотонно — похоже на leak.\n"
                            + "Grafana: JVM Memory dashboard. Нужен heap dump до рестарта.",
                    "incident", tid));
        }

        if (findTaskIdByTag(tasks, ScenarioTag.KAFKA_CONSUMER) != null) {
            emails.add(new EmailMessage(
                    "email-kafka-alert",
                    "Grafana Alerting",
                    "Kafka consumer lag > 1000 (checkout-service)",
                    "Topic orders.created — lag 1842 messages.\n"
                            + "Внешняя интеграция payment-gateway отвечает 504. Проверьте метрики.",
                    "incident", findTaskIdByTag(tasks, ScenarioTag.KAFKA_CONSUMER)));
        }

        String obsTaskId = findTaskIdByTag(tasks, ScenarioTag.METRICS_SLA);
        if (obsTaskId == null) {
            obsTaskId = findTaskIdByTag(tasks, ScenarioTag.SQL_SLOW_QUERY);
        }
        if (obsTaskId != null) {
            emails.add(new EmailMessage(
                    "email-obs-sla",
                    "Grafana Alerting",
                    "SLA breach — external integrations",
                    "partner-api error rate 2.1%, p99 latency 890ms (SLA: 500ms).\n"
                            + "Dashboard: External Integrations → проверьте метрики.",
                    "incident", obsTaskId));
        }

        if (day > 1) {
            emails.add(new EmailMessage(
                    "email-github-dependabot",
                    "GitHub Dependabot",
                    "Security update: spring-core",
                    "Dependabot opened PR #312. CI pipeline pending.\n"
                            + "Review required before merge to main.",
                    "github", null));
        }

        return emails;
    }

    private static String findFirstJavaBugTaskId(List<InteractiveTask> tasks) {
        return tasks.stream()
                .filter(t -> t.getScenarioTag().name().startsWith("JAVA_"))
                .map(InteractiveTask::getId)
                .findFirst()
                .orElse(null);
    }

    private static String findTaskIdByTag(List<InteractiveTask> tasks, ScenarioTag tag) {
        return tasks.stream()
                .filter(t -> t.getScenarioTag() == tag)
                .map(InteractiveTask::getId)
                .findFirst()
                .orElse(null);
    }

    private static String findTaskId(List<InteractiveTask> tasks, String ticketId) {
        return tasks.stream()
                .filter(t -> t.getTicketId().equals(ticketId))
                .map(InteractiveTask::getId)
                .findFirst()
                .orElse(null);
    }

    private EmailLibrary() {
    }
}
