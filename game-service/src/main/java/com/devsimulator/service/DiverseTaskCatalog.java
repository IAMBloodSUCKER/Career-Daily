package com.devsimulator.service;

import com.devsimulator.model.CareerTier;
import com.devsimulator.model.CodeChallenge;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.ObjectiveType;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ReplyOption;
import com.devsimulator.model.ScenarioTag;
import com.devsimulator.model.TaskObjective;
import com.devsimulator.model.TaskType;
import com.devsimulator.model.TeamMemberIntro;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.function.Supplier;

/** Разнообразные задачи: Java-теория, SQL, траблшутинг, релиз, алгоритмы. */
public final class DiverseTaskCatalog {

    private DiverseTaskCatalog() {
    }

    public static InteractiveTask pickCoreWorkTask(
            CareerTier tier, GameMode mode, int day, ProjectProfile profile, Random rnd) {
        List<Supplier<InteractiveTask>> pool = new ArrayList<>();

        if (tier == CareerTier.INTERN) {
            pool.add(() -> TaskPool.randomInternJavaBug(profile, rnd));
            if (day >= tier.theoryQuizFromDay(mode)) {
                pool.add(() -> randomInternQuiz(profile, rnd));
            }
            return pool.get(rnd.nextInt(pool.size())).get();
        }

        pool.add(() -> TaskPool.randomJavaBug(profile, rnd));
        if (day >= tier.theoryQuizFromDay(mode)) {
            pool.add(() -> randomJavaQuiz(profile, rnd));
            pool.add(() -> randomAlgorithmQuiz(profile, rnd));
        }
        if (day >= tier.sqlAnalyticsFromDay(mode)) {
            pool.add(() -> randomSqlAnalytics(profile, rnd));
        }
        if (day >= tier.troubleshootFromDay(mode)) {
            pool.add(() -> randomTroubleshoot(profile, rnd));
            pool.add(() -> randomTroubleshoot(profile, rnd));
        }
        if (day >= tier.releaseFromDay(mode)) {
            pool.add(() -> randomRelease(profile, rnd));
        }
        if (day >= tier.observabilityFromDay(mode)) {
            pool.add(() -> TaskPool.randomObservabilityTask(profile, rnd));
            pool.add(() -> TaskPool.randomSqlTask(profile, rnd));
        }

        return pool.get(rnd.nextInt(pool.size())).get();
    }

    public static InteractiveTask randomInternQuiz(ProjectProfile profile, Random rnd) {
        return TaskPool.pickRandom(internQuizPool(profile), rnd);
    }

    public static InteractiveTask randomJavaQuiz(ProjectProfile profile, Random rnd) {
        return TaskPool.pickRandom(javaQuizPool(profile), rnd);
    }

    public static InteractiveTask randomSqlAnalytics(ProjectProfile profile, Random rnd) {
        return TaskPool.pickRandom(sqlAnalyticsPool(profile), rnd);
    }

    public static InteractiveTask randomTroubleshoot(ProjectProfile profile, Random rnd) {
        return TaskPool.pickRandom(TroubleshootTaskCatalog.all(profile), rnd);
    }

    public static InteractiveTask randomRelease(ProjectProfile profile, Random rnd) {
        return TaskPool.pickRandom(releasePool(profile), rnd);
    }

    public static InteractiveTask randomAlgorithmQuiz(ProjectProfile profile, Random rnd) {
        return TaskPool.pickRandom(algorithmPool(profile), rnd);
    }

    public static List<InteractiveTask> allBonusCandidates(
            ProjectProfile profile, CareerTier tier, GameMode mode, int day) {
        List<InteractiveTask> list = new ArrayList<>();
        if (tier == CareerTier.INTERN) {
            list.addAll(internQuizPool(profile));
            return list;
        }
        list.addAll(javaQuizPool(profile));
        list.addAll(algorithmPool(profile));
        if (day >= tier.sqlAnalyticsFromDay(mode)) {
            list.addAll(sqlAnalyticsPool(profile));
        }
        if (day >= tier.troubleshootFromDay(mode)) {
            list.addAll(TroubleshootTaskCatalog.all(profile));
        }
        if (day >= tier.releaseFromDay(mode)) {
            list.addAll(releasePool(profile));
        }
        return list;
    }

    private static String leadName(ProjectProfile profile) {
        return profile.team().stream()
                .filter(m -> "igor".equals(m.id()) || "anna".equals(m.id()))
                .map(TeamMemberIntro::name)
                .findFirst()
                .orElse("Тимлид");
    }

    private static List<TaskObjective> quizObjectives(
            String ticketId, String contactId, String msgId, String contactLabel) {
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать вопрос от " + contactLabel + " в Slack", contactId, msgId, null),
                new TaskObjective("obj-answer-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Ответить в Slack (выберите верный вариант)", contactId, null, null),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Перевести " + ticketId + " в Done")
        );
    }

    private static List<TaskObjective> sqlAnalyticsObjectives(
            ProjectProfile profile, String ticketId, String pgAction, String pgButtonLabel) {
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Slack: прочитать ТЗ (" + leadName(profile) + ")", "igor",
                        ScenarioLibrary.sqlAnalyticsMessageId(ticketId), null),
                new TaskObjective("obj-sql-" + ticketId, ObjectiveType.CHECK_METRICS,
                        "pgAdmin: «" + pgButtonLabel + "»", "postgresql", pgAction, null),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Slack → Dmitry (DBA): отправить результат", "dmitry", null, null),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "JIRA: закрыть " + ticketId)
        );
    }

    private static List<InteractiveTask> internQuizPool(ProjectProfile profile) {
        return List.of(quiz101Final(), quiz102TryCatch());
    }

    private static InteractiveTask quiz101Final() {
        String ticket = "QUIZ-101";
        return new InteractiveTask(ticket, "📚 Final и изменяемость объекта",
                "Стажёр: можно ли менять поля final-объекта?",
                TaskType.LEARNING, ScenarioTag.JAVA_QUIZ, 1,
                quizObjectives(ticket, "anna", ScenarioLibrary.quizMessageId(ticket), "Anna"),
                null,
                List.of(
                        new ReplyOption("quiz-final-no", "Нет, final запрещает любые изменения", false,
                                "Anna: «Ссылку нельзя, но состояние объекта можно»"),
                        new ReplyOption("quiz-final-yes",
                                "Ссылку не переприсвоить, но поля объекта менять можно", true,
                                "Anna: «Верно! final ≠ immutable»")
                ));
    }

    private static InteractiveTask quiz102TryCatch() {
        String ticket = "QUIZ-102";
        return new InteractiveTask(ticket, "📚 try-catch-finally",
                "Что выведется при двух throw в одном try?",
                TaskType.LEARNING, ScenarioTag.JAVA_QUIZ, 1,
                quizObjectives(ticket, "anna", ScenarioLibrary.quizMessageId(ticket), "Anna"),
                null,
                List.of(
                        new ReplyOption("quiz-catch-right",
                                "Строка 13 не выполнится — нужны отдельные try", true,
                                "Anna: «Верно!»"),
                        new ReplyOption("quiz-catch-wrong", "catch ловит оба throw", false,
                                "Anna: «Нужен отдельный try для каждого»")
                ));
    }

    private static List<InteractiveTask> javaQuizPool(ProjectProfile profile) {
        return List.of(quiz103HashMap(), quiz104Password(), quiz105Stream(), quiz106StreamCode());
    }

    private static InteractiveTask quiz103HashMap() {
        String ticket = "QUIZ-103";
        return new InteractiveTask(ticket, "📚 HashMap и mutable objects",
                "Что выведет map.get(1) после replaceInMethod?",
                TaskType.LEARNING, ScenarioTag.JAVA_QUIZ, 1,
                quizObjectives(ticket, "alex", ScenarioLibrary.quizMessageId(ticket), "Alex"),
                null,
                List.of(new ReplyOption("quiz-hm-same",
                        "123/uuu — одна ссылка, меняется state", true,
                        "Alex: «Именно!»"),
                        new ReplyOption("quiz-hm-copy", "Новый объект в map", false,
                                "Alex: «Pass-by-value ссылки»")));
    }

    private static InteractiveTask quiz104Password() {
        String ticket = "QUIZ-104";
        return new InteractiveTask(ticket, "📚 String vs char[] для пароля",
                "Как безопаснее хранить пароль?",
                TaskType.LEARNING, ScenarioTag.JAVA_QUIZ, 1,
                quizObjectives(ticket, "alex", ScenarioLibrary.quizMessageId(ticket), "Alex"),
                null,
                List.of(new ReplyOption("quiz-pw-char", "char[] — можно zero-fill", true,
                                "Alex: «Верно»"),
                        new ReplyOption("quiz-pw-string", "String immutable = безопасно", false,
                                "Alex: «String остаётся в pool»")));
    }

    private static InteractiveTask quiz105Stream() {
        String ticket = "QUIZ-105";
        return new InteractiveTask(ticket, "📚 Stream API",
                "filter → map → collect для строк >3 символов",
                TaskType.LEARNING, ScenarioTag.JAVA_QUIZ, 1,
                quizObjectives(ticket, "igor", ScenarioLibrary.quizMessageId(ticket), "Igor"),
                null,
                List.of(new ReplyOption("quiz-stream-right",
                        "stream → filter → map(toUpperCase) → collect", true,
                        "Igor: «Классика»"),
                        new ReplyOption("quiz-stream-wrong", "forEach + println", false,
                                "Igor: «Нужен collect»")));
    }

    private static InteractiveTask quiz106StreamCode() {
        String ticket = "QUIZ-106";
        return new InteractiveTask(ticket, "💻 Stream: дубликаты чисел",
                "groupingBy + counting в IntelliJ",
                TaskType.LEARNING, ScenarioTag.JAVA_QUIZ, 2,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack → задача", "igor", ScenarioLibrary.quizMessageId(ticket), null),
                        new TaskObjective("obj-tests-" + ticket, ObjectiveType.RUN_TESTS, "Run Tests"),
                        new TaskObjective("obj-fix-" + ticket, ObjectiveType.SUBMIT_FIX, "Допишите stream"),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Ответ Igor", "igor", null, "quiz-stream-done"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ),
                streamDuplicatesChallenge(),
                List.of(new ReplyOption("quiz-stream-done", "Готово", true, "Igor: «LGTM»")));
    }

    private static CodeChallenge streamDuplicatesChallenge() {
        return new CodeChallenge("StreamDuplicates.java", """
                import java.util.*;
                import java.util.stream.*;
                public class StreamDuplicates {
                    public static List<Integer> findDuplicates(List<Integer> nums) {
                        return List.of();
                    }
                }
                """, "groupingBy + counting", List.of("groupingBy", "counting"), List.of("return List.of();"));
    }

    private static List<InteractiveTask> sqlAnalyticsPool(ProjectProfile profile) {
        return List.of(sql301Salary(profile), sql302Budget(profile), sql303MaxAge(profile), sql304Duplicates(profile));
    }

    private static InteractiveTask sql301Salary(ProjectProfile profile) {
        String ticket = "SQL-301";
        return new InteractiveTask(ticket, "📊 SQL: зарплаты по отделам",
                "Средняя зарплата по отделам (AVG > 65000). pgAdmin → кнопка внизу → Slack Dmitry.",
                TaskType.REFACTORING, ScenarioTag.SQL_ANALYTICS, 2,
                sqlAnalyticsObjectives(profile, ticket, "sql-salary-dept", "HR: зарплаты по отделам"),
                null,
                List.of(new ReplyOption("sql301-report", "IT avg 78333 — топ по зарплате", true,
                        "Dmitry: «Ok»")));
    }

    private static InteractiveTask sql302Budget(ProjectProfile profile) {
        String ticket = "SQL-302";
        return new InteractiveTask(ticket, "📊 SQL: бюджет проектов vs отдел",
                "Проекты с суммой бюджета выше бюджета отдела. pgAdmin → кнопка внизу → Slack Dmitry.",
                TaskType.REFACTORING, ScenarioTag.SQL_ANALYTICS, 2,
                sqlAnalyticsObjectives(profile, ticket, "sql-budget-overrun", "Бюджет проектов"),
                null,
                List.of(new ReplyOption("sql302-report", "IT overrun 30k", true, "Dmitry: «Replan»")));
    }

    private static InteractiveTask sql303MaxAge(ProjectProfile profile) {
        String ticket = "SQL-303";
        return new InteractiveTask(ticket, "📊 SQL: MAX(age) по имени",
                "Максимальный возраст для каждого имени в Person. pgAdmin → кнопка внизу → Slack Dmitry.",
                TaskType.REFACTORING, ScenarioTag.SQL_ANALYTICS, 1,
                sqlAnalyticsObjectives(profile, ticket, "sql-max-age", "Person: MAX(age)"),
                null,
                List.of(new ReplyOption("sql303-report", "Иван→35, Петр→40…", true, "Dmitry: «Ok»")));
    }

    private static InteractiveTask sql304Duplicates(ProjectProfile profile) {
        String ticket = "SQL-304";
        return new InteractiveTask(ticket, "📊 SQL: дубликаты name+age",
                "Пары name+age с COUNT(*) > 1. pgAdmin → кнопка внизу → Slack Dmitry.",
                TaskType.REFACTORING, ScenarioTag.SQL_ANALYTICS, 2,
                sqlAnalyticsObjectives(profile, ticket, "sql-person-dupes", "Person: дубликаты name+age"),
                null,
                List.of(new ReplyOption("sql304-report", "Полных dupes нет", true, "Dmitry: «Clean»")));
    }

    private static List<InteractiveTask> releasePool(ProjectProfile profile) {
        return List.of(rel501Staging(), rel502Canary());
    }

    private static InteractiveTask rel501Staging() {
        String ticket = "REL-501";
        return new InteractiveTask(ticket, "🚀 Deploy staging",
                "Jenkins → smoke → отчёт PM",
                TaskType.FEATURE, ScenarioTag.RELEASE_DEPLOY, 2,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack PM", "igor", ScenarioLibrary.releaseMessageId(ticket), null),
                        new TaskObjective("obj-jenkins-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Jenkins deploy", "jenkins", "deploy-staging", null),
                        new TaskObjective("obj-smoke-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Postman smoke", "postman", "smoke-staging", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Отчёт", "igor", null, "rel-staging-ok"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("rel-staging-ok", "Staging green", true, "Igor: «Approved»")));
    }

    private static InteractiveTask rel502Canary() {
        String ticket = "REL-502";
        return new InteractiveTask(ticket, "🚀 Canary rollout",
                "10% traffic → metrics → promote",
                TaskType.FEATURE, ScenarioTag.RELEASE_DEPLOY, 3,
                List.of(
                        new TaskObjective("obj-read-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Slack", "igor", ScenarioLibrary.releaseMessageId(ticket), null),
                        new TaskObjective("obj-k8s-" + ticket, ObjectiveType.CHECK_METRICS,
                                "K8s canary", "kubernetes", "rollout-canary", null),
                        new TaskObjective("obj-grafana-" + ticket, ObjectiveType.CHECK_METRICS,
                                "Grafana errors", "grafana", "canary-errors", null),
                        new TaskObjective("obj-reply-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Promote/rollback", "igor", null, "rel-canary-promote"),
                        new TaskObjective("obj-jira-" + ticket, ObjectiveType.CLOSE_JIRA, "Done")
                ), null,
                List.of(new ReplyOption("rel-canary-promote", "Promote 100%", true, "Igor: «Done»")));
    }

    private static List<InteractiveTask> algorithmPool(ProjectProfile profile) {
        return List.of(alg601TwoPointers(), alg602Bubble());
    }

    private static InteractiveTask alg601TwoPointers() {
        String ticket = "ALG-601";
        return new InteractiveTask(ticket, "🧮 Two Sum — два указателя",
                "Sorted array + target",
                TaskType.LEARNING, ScenarioTag.ALGORITHM_BASICS, 1,
                quizObjectives(ticket, "alex", ScenarioLibrary.algorithmMessageId(ticket), "Alex"),
                null,
                List.of(new ReplyOption("alg-two-pointers", "left/right по sum vs target", true,
                                "Alex: «Classic»"),
                        new ReplyOption("alg-two-brute", "O(n²) nested loops", false,
                                "Alex: «Ждут O(n)»")));
    }

    private static InteractiveTask alg602Bubble() {
        String ticket = "ALG-602";
        return new InteractiveTask(ticket, "🧮 Пузырёк vs выбор",
                "Когда O(n²) допустима?",
                TaskType.LEARNING, ScenarioTag.ALGORITHM_BASICS, 1,
                quizObjectives(ticket, "alex", ScenarioLibrary.algorithmMessageId(ticket), "Alex"),
                null,
                List.of(new ReplyOption("alg-sort-bubble", "Tiny n — пузырёк прост", true,
                                "Alex: «n≤20 ok»"),
                        new ReplyOption("alg-sort-nlogn", "Всегда QuickSort", false,
                                "Alex: «Overkill»")));
    }
}
