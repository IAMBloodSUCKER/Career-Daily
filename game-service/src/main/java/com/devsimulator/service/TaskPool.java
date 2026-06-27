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
import java.util.Set;

public final class TaskPool {

    private TaskPool() {
    }

    public static <T> T pickRandom(List<T> list, Random rnd) {
        if (list == null || list.isEmpty()) {
            throw new IllegalArgumentException("Cannot pick from empty list");
        }
        return list.get(rnd.nextInt(list.size()));
    }

    public static InteractiveTask randomInternJavaBug(ProjectProfile profile, Random rnd) {
        return pickRandom(internJavaBugPool(profile), rnd);
    }

    public static InteractiveTask randomJavaBug(ProjectProfile profile, Random rnd) {
        return pickRandom(javaBugPool(profile), rnd);
    }

    public static InteractiveTask randomCodeReview(ProjectProfile profile, Random rnd) {
        return pickRandom(codeReviewPool(profile), rnd);
    }

    public static InteractiveTask randomProductionIncident(ProjectProfile profile, Random rnd) {
        return pickRandom(productionIncidentPool(profile), rnd);
    }

    public static InteractiveTask randomMemoryLeak(ProjectProfile profile, Random rnd) {
        return pickRandom(memoryLeakPool(profile), rnd);
    }

    public static InteractiveTask randomKafkaTask(ProjectProfile profile, Random rnd) {
        return pickRandom(kafkaTaskPool(profile), rnd);
    }

    public static InteractiveTask randomObservabilityTask(ProjectProfile profile, Random rnd) {
        return pickRandom(observabilityPool(profile), rnd);
    }

    public static InteractiveTask randomSqlTask(ProjectProfile profile, Random rnd) {
        return pickRandom(sqlTaskPool(profile), rnd);
    }

    public static InteractiveTask randomFeatureTask(ProjectProfile profile, Random rnd) {
        return pickRandom(featureTaskPool(profile), rnd);
    }

    public static InteractiveTask randomInterviewReview(ProjectProfile profile, Random rnd) {
        return pickRandom(interviewReviewPool(profile), rnd);
    }

    public static InteractiveTask randomBonusTask(ProjectProfile profile, GameMode mode, int day,
                                                  int experienceYears, Random rnd,
                                                  Set<String> usedTicketIds) {
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        List<InteractiveTask> candidates = new ArrayList<>();

        if (tier == CareerTier.INTERN) {
            candidates.addAll(internJavaBugPool(profile));
        } else {
            candidates.addAll(javaBugPool(profile));
            if (day >= tier.codeReviewFromDay(mode)) {
                candidates.addAll(codeReviewPool(profile));
            }
            if (day >= tier.interviewReviewFromDay(mode)) {
                candidates.addAll(interviewReviewPool(profile));
            }
            if (mode == GameMode.REALISTIC || mode == GameMode.CHALLENGE) {
                if (day >= tier.inc501FromDay(mode)) {
                    candidates.addAll(productionIncidentPool(profile));
                }
                if (day >= tier.inc502FromDay(mode)) {
                    candidates.addAll(memoryLeakPool(profile));
                }
                if (day >= tier.kafkaFromDay(mode)) {
                    candidates.addAll(kafkaTaskPool(profile));
                }
            }
            if (day >= tier.featureTaskFromDay(mode)) {
                candidates.addAll(featureTaskPool(profile));
            }
            if (day >= tier.observabilityFromDay(mode)) {
                candidates.addAll(observabilityPool(profile));
                candidates.addAll(sqlTaskPool(profile));
            }
            candidates.addAll(DiverseTaskCatalog.allBonusCandidates(profile, tier, mode, day));
        }

        List<InteractiveTask> available = candidates.stream()
                .filter(t -> usedTicketIds == null || !usedTicketIds.contains(t.getTicketId()))
                .toList();
        if (available.isEmpty()) {
            return null;
        }
        return pickRandom(available, rnd);
    }

    private static String memberName(ProjectProfile profile, String id, String fallback) {
        return profile.team().stream()
                .filter(m -> id.equals(m.id()))
                .map(TeamMemberIntro::name)
                .findFirst()
                .orElse(fallback);
    }

    private static TaskObjective requestReviewObjective(ProjectProfile profile, String ticketId) {
        return new TaskObjective("obj-review-" + ticketId, ObjectiveType.REQUEST_REVIEW,
                "Запросить code review у " + memberName(profile, "alex", "коллеги"),
                "alex", null, null);
    }

    // --- Intern Java bugs (no git push) ---

    private static List<InteractiveTask> internJavaBugPool(ProjectProfile profile) {
        return List.of(
                internNpe142(profile),
                internNpe156(profile),
                internIndexOob163(profile),
                internOptional171(profile),
                internResource178(profile),
                internOffByOne185(profile),
                internStringBuilder192(profile),
                internEqualsNull199(profile),
                internParseInt204(profile),
                internEmptyCollection211(profile)
        );
    }

    private static List<TaskObjective> internBugObjectives(ProjectProfile profile, String contactId,
                                                            String ticketId) {
        String qaName = memberName(profile, contactId, "QA");
        String msgId = ScenarioLibrary.bugMessageId(ticketId);
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать сообщение от " + qaName + " в Slack", contactId, msgId, null),
                new TaskObjective("obj-tests-" + ticketId, ObjectiveType.RUN_TESTS,
                        "Запустить тесты в IntelliJ (увидите ошибку)"),
                new TaskObjective("obj-fix-" + ticketId, ObjectiveType.SUBMIT_FIX,
                        "Исправить баг и закоммитить (Commit Fix)"),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Ответить " + qaName + " в Slack", contactId, null, "reply-fixed"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Перевести " + ticketId + " в Done")
        );
    }

    private static InteractiveTask internNpe142(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-142",
                "🐛 JIRA-142: NullPointerException",
                "Простая задача для стажёра: NPE в OrderService.processPayment().",
                TaskType.BUG_FIX, ScenarioTag.JAVA_NPE, 1,
                internBugObjectives(profile, "maria", "JIRA-142"),
                npeOrderServiceChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internNpe156(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-156",
                "🐛 JIRA-156: NPE в UserService",
                "Стажёрская задача: getDisplayName() падает на null user.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_NPE, 1,
                internBugObjectives(profile, "maria", "JIRA-156"),
                npeUserServiceChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internIndexOob163(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-163",
                "🐛 JIRA-163: IndexOutOfBoundsException",
                "Стажёр: некорректный индекс в CartService.removeItem().",
                TaskType.BUG_FIX, ScenarioTag.JAVA_INDEX_OOB, 1,
                internBugObjectives(profile, "maria", "JIRA-163"),
                indexOobChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internOptional171(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-171",
                "🐛 JIRA-171: NoSuchElementException",
                "Optional.get() без isPresent() в ProfileService.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_OPTIONAL, 1,
                internBugObjectives(profile, "maria", "JIRA-171"),
                optionalChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internResource178(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-178",
                "🐛 JIRA-178: Resource leak",
                "FileInputStream не закрывается в ReportExporter.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_RESOURCE, 1,
                internBugObjectives(profile, "maria", "JIRA-178"),
                resourceLeakChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internOffByOne185(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-185",
                "🐛 JIRA-185: Off-by-one",
                "Цикл i <= length в BatchProcessor — лишняя итерация.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_OFF_BY_ONE, 1,
                internBugObjectives(profile, "maria", "JIRA-185"),
                offByOneChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internStringBuilder192(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-192",
                "🐛 JIRA-192: String concat в цикле",
                "LogBuilder использует + вместо StringBuilder.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_STRING_BUILDER, 1,
                internBugObjectives(profile, "maria", "JIRA-192"),
                stringBuilderChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internEqualsNull199(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-199",
                "🐛 JIRA-199: NPE при сравнении строк",
                "status == \"ACTIVE\" — NPE если status null.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_EQUALS_NULL, 1,
                internBugObjectives(profile, "maria", "JIRA-199"),
                equalsNullChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internParseInt204(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-204",
                "🐛 JIRA-204: NumberFormatException",
                "Integer.parseInt без проверки в ConfigLoader.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_PARSE_INT, 1,
                internBugObjectives(profile, "maria", "JIRA-204"),
                parseIntChallenge(),
                internReplies()
        );
    }

    private static InteractiveTask internEmptyCollection211(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-211",
                "🐛 JIRA-211: IndexOutOfBounds на пустом списке",
                "items.get(0) без проверки isEmpty() в OrderValidator.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_EMPTY_COLLECTION, 1,
                internBugObjectives(profile, "maria", "JIRA-211"),
                emptyCollectionChallenge(),
                internReplies()
        );
    }

    private static List<ReplyOption> internReplies() {
        return List.of(
                new ReplyOption("reply-fixed", "Исправил — null-check добавлен ✅", true,
                        "Мария: «Спасибо! Закрою тикет 👍»"),
                new ReplyOption("reply-later", "Сделаю позже", false,
                        "Мария: «Ок, но не затягивай — дедлайн в пятницу»")
        );
    }

    // --- Full Java bugs (git flow) ---

    private static List<InteractiveTask> javaBugPool(ProjectProfile profile) {
        return List.of(
                javaBugNpe142(profile),
                javaBugNpe156(profile),
                javaBugIndexOob163(profile),
                javaBugOptional171(profile),
                javaBugResource178(profile),
                javaBugOffByOne185(profile),
                javaBugStringBuilder192(profile),
                javaBugEqualsNull199(profile),
                javaBugParseInt204(profile),
                javaBugEmptyCollection211(profile)
        );
    }

    private static List<TaskObjective> fullBugObjectives(ProjectProfile profile, String contactId,
                                                          String ticketId) {
        String qaName = memberName(profile, contactId, "QA");
        String msgId = ScenarioLibrary.bugMessageId(ticketId);
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать сообщение от " + qaName + " в Slack", contactId, msgId, null),
                new TaskObjective("obj-tests-" + ticketId, ObjectiveType.RUN_TESTS,
                        "Запустить тесты в IntelliJ (увидите ошибку)"),
                new TaskObjective("obj-fix-" + ticketId, ObjectiveType.SUBMIT_FIX,
                        "Исправить баг и закоммитить (Commit Fix)"),
                new TaskObjective("obj-push-" + ticketId, ObjectiveType.GIT_PUSH,
                        "Запушить ветку в origin (Git → Push)"),
                new TaskObjective("obj-pr-" + ticketId, ObjectiveType.CREATE_PR,
                        "Создать Pull Request в GitHub"),
                requestReviewObjective(profile, ticketId),
                new TaskObjective("obj-merge-" + ticketId, ObjectiveType.MERGE_PR,
                        "Влить PR: IntelliJ → Git → git checkout main → git merge"),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Ответить " + qaName + " в Slack", contactId, null, "reply-fixed"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Перевести " + ticketId + " в Done")
        );
    }

    private static List<ReplyOption> fullBugReplies(String ticketId) {
        return List.of(
                new ReplyOption("reply-fixed",
                        "Пофиксил " + ticketId + " — PR влит в main. Можно проверять на staging.",
                        true, "Мария: «Спасибо! Проверю на staging 👍»"),
                new ReplyOption("reply-tomorrow",
                        "Сделаю завтра, сейчас занят.",
                        false, "Мария: «Блокер для релиза! Team Lead уже спрашивает 😤» (+стресс)"),
                new ReplyOption("reply-cant-repro",
                        "Не могу воспроизвести баг.",
                        false, "Мария: «У меня воспроизводится стабильно. Логи приложила.»")
        );
    }

    private static InteractiveTask javaBugNpe142(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-142",
                "NullPointerException в OrderService.processPayment()",
                "NPE блокирует checkout в " + profile.companyName() + ". Stack trace — getEmail() на null.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_NPE, 2,
                fullBugObjectives(profile, "maria", "JIRA-142"),
                npeOrderServiceChallenge(),
                fullBugReplies("JIRA-142")
        );
    }

    private static InteractiveTask javaBugNpe156(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-156",
                "NullPointerException в UserService.getDisplayName()",
                "Профиль пользователя падает при null user в " + profile.productName() + ".",
                TaskType.BUG_FIX, ScenarioTag.JAVA_NPE, 2,
                fullBugObjectives(profile, "maria", "JIRA-156"),
                npeUserServiceChallenge(),
                fullBugReplies("JIRA-156")
        );
    }

    private static InteractiveTask javaBugIndexOob163(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-163",
                "IndexOutOfBoundsException в CartService.removeItem()",
                "Удаление последнего товара из корзины падает с IOOBE.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_INDEX_OOB, 2,
                fullBugObjectives(profile, "maria", "JIRA-163"),
                indexOobChallenge(),
                fullBugReplies("JIRA-163")
        );
    }

    private static InteractiveTask javaBugOptional171(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-171",
                "NoSuchElementException в ProfileService",
                "Optional.get() без проверки — типичная ошибка junior.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_OPTIONAL, 2,
                fullBugObjectives(profile, "maria", "JIRA-171"),
                optionalChallenge(),
                fullBugReplies("JIRA-171")
        );
    }

    private static InteractiveTask javaBugResource178(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-178",
                "Resource leak в ReportExporter",
                "Too many open files — FileInputStream не закрывается.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_RESOURCE, 2,
                fullBugObjectives(profile, "maria", "JIRA-178"),
                resourceLeakChallenge(),
                fullBugReplies("JIRA-178")
        );
    }

    private static InteractiveTask javaBugOffByOne185(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-185",
                "Off-by-one в BatchProcessor",
                "ArrayIndexOutOfBounds на последней итерации batch job.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_OFF_BY_ONE, 2,
                fullBugObjectives(profile, "maria", "JIRA-185"),
                offByOneChallenge(),
                fullBugReplies("JIRA-185")
        );
    }

    private static InteractiveTask javaBugStringBuilder192(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-192",
                "Неэффективная конкатенация в LogBuilder",
                "OOM risk при большом объёме логов — concat в цикле.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_STRING_BUILDER, 2,
                fullBugObjectives(profile, "maria", "JIRA-192"),
                stringBuilderChallenge(),
                fullBugReplies("JIRA-192")
        );
    }

    private static InteractiveTask javaBugEqualsNull199(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-199",
                "NPE при сравнении строк в StatusChecker",
                "status == \"ACTIVE\" — классическая ловушка с null.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_EQUALS_NULL, 2,
                fullBugObjectives(profile, "maria", "JIRA-199"),
                equalsNullChallenge(),
                fullBugReplies("JIRA-199")
        );
    }

    private static InteractiveTask javaBugParseInt204(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-204",
                "NumberFormatException в ConfigLoader",
                "Парсинг env-переменной без валидации — падение при деплое.",
                TaskType.BUG_FIX, ScenarioTag.JAVA_PARSE_INT, 2,
                fullBugObjectives(profile, "maria", "JIRA-204"),
                parseIntChallenge(),
                fullBugReplies("JIRA-204")
        );
    }

    private static InteractiveTask javaBugEmptyCollection211(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-211",
                "IndexOutOfBounds на пустой коллекции",
                "OrderValidator.items.get(0) без проверки isEmpty().",
                TaskType.BUG_FIX, ScenarioTag.JAVA_EMPTY_COLLECTION, 2,
                fullBugObjectives(profile, "maria", "JIRA-211"),
                emptyCollectionChallenge(),
                fullBugReplies("JIRA-211")
        );
    }

    // --- Code challenges ---

    private static CodeChallenge npeOrderServiceChallenge() {
        return new CodeChallenge(
                "OrderService.java",
                """
                public class OrderService {

                    public void processPayment(Order order) {
                        Customer customer = order.getCustomer();
                        // BUG: customer может быть null
                        String email = customer.getEmail();
                        sendReceipt(email, order.getTotal());
                    }

                    private void sendReceipt(String email, double total) {
                        System.out.println("Receipt sent to " + email);
                    }
                }
                """,
                "Добавьте проверку customer на null перед вызовом getEmail()",
                List.of("if (customer == null)", "if (customer != null)"),
                List.of("customer.getEmail();")
        );
    }

    private static CodeChallenge npeUserServiceChallenge() {
        return new CodeChallenge(
                "UserService.java",
                """
                public class UserService {

                    public String getDisplayName(User user) {
                        // BUG: user может быть null
                        return user.getFirstName() + " " + user.getLastName();
                    }
                }
                """,
                "Добавьте проверку user на null перед доступом к полям",
                List.of("if (user == null)", "if (user != null)", "Objects.requireNonNull"),
                List.of("user.getFirstName()")
        );
    }

    private static CodeChallenge indexOobChallenge() {
        return new CodeChallenge(
                "CartService.java",
                """
                public class CartService {

                    public void removeItem(List<Item> items, int index) {
                        // BUG: index может быть равен size()
                        Item removed = items.get(index);
                        items.remove(removed);
                    }
                }
                """,
                "Проверьте границы: index >= 0 && index < items.size()",
                List.of("index < items.size()", "index >= 0"),
                List.of("items.get(index)")
        );
    }

    private static CodeChallenge optionalChallenge() {
        return new CodeChallenge(
                "ProfileService.java",
                """
                public class ProfileService {

                    public String getBio(User user) {
                        Optional<String> bio = user.getBio();
                        // BUG: get() без isPresent()
                        return bio.get();
                    }
                }
                """,
                "Используйте orElse/orElseThrow вместо get() без проверки",
                List.of("orElse", "orElseThrow", "isPresent", "ifPresent"),
                List.of("bio.get()")
        );
    }

    private static CodeChallenge resourceLeakChallenge() {
        return new CodeChallenge(
                "ReportExporter.java",
                """
                public class ReportExporter {

                    public byte[] export(File file) throws IOException {
                        // BUG: stream не закрывается
                        FileInputStream fis = new FileInputStream(file);
                        return fis.readAllBytes();
                    }
                }
                """,
                "Используйте try-with-resources для FileInputStream",
                List.of("try (", "try-with-resources", "fis.close()"),
                List.of("FileInputStream fis = new FileInputStream")
        );
    }

    private static CodeChallenge offByOneChallenge() {
        return new CodeChallenge(
                "BatchProcessor.java",
                """
                public class BatchProcessor {

                    public void process(String[] batch) {
                        // BUG: off-by-one — i <= length
                        for (int i = 0; i <= batch.length; i++) {
                            handle(batch[i]);
                        }
                    }

                    private void handle(String item) { /* ... */ }
                }
                """,
                "Исправьте условие цикла: i < batch.length",
                List.of("i < batch.length"),
                List.of("i <= batch.length")
        );
    }

    private static CodeChallenge stringBuilderChallenge() {
        return new CodeChallenge(
                "LogBuilder.java",
                """
                public class LogBuilder {

                    public String build(List<String> lines) {
                        String result = "";
                        // BUG: concat в цикле
                        for (String line : lines) {
                            result = result + line + "\\n";
                        }
                        return result;
                    }
                }
                """,
                "Замените конкатенацию на StringBuilder",
                List.of("StringBuilder", "append("),
                List.of("result = result +")
        );
    }

    private static CodeChallenge equalsNullChallenge() {
        return new CodeChallenge(
                "StatusChecker.java",
                """
                public class StatusChecker {

                    public boolean isActive(String status) {
                        // BUG: NPE если status == null
                        return status == "ACTIVE";
                    }
                }
                """,
                "Используйте \"ACTIVE\".equals(status) для null-safe сравнения",
                List.of("\"ACTIVE\".equals", "Objects.equals"),
                List.of("status == \"ACTIVE\"")
        );
    }

    private static CodeChallenge parseIntChallenge() {
        return new CodeChallenge(
                "ConfigLoader.java",
                """
                public class ConfigLoader {

                    public int loadTimeout(String envValue) {
                        // BUG: parseInt без проверки
                        return Integer.parseInt(envValue);
                    }
                }
                """,
                "Обработайте NumberFormatException или проверьте строку перед parseInt",
                List.of("try {", "NumberFormatException", "matches", "isBlank"),
                List.of("Integer.parseInt(envValue)")
        );
    }

    private static CodeChallenge emptyCollectionChallenge() {
        return new CodeChallenge(
                "OrderValidator.java",
                """
                public class OrderValidator {

                    public boolean hasItems(List<OrderItem> items) {
                        // BUG: get(0) на пустом списке
                        return items.get(0) != null;
                    }
                }
                """,
                "Проверьте isEmpty() перед доступом к первому элементу",
                List.of("isEmpty()", "!items.isEmpty()", "items.size()"),
                List.of("items.get(0)")
        );
    }

    // --- Code review pool ---

    private static List<InteractiveTask> codeReviewPool(ProjectProfile profile) {
        return List.of(
                codeReviewMethod247(profile),
                codeReviewMethod248(profile),
                codeReviewMethod249(profile),
                codeReviewStyle251(profile),
                codeReviewStyle252(profile),
                codeReviewStyle253(profile),
                codeReviewSecurity261(profile),
                codeReviewSecurity262(profile),
                codeReviewSecurity263(profile)
        );
    }

    private static List<TaskObjective> codeReviewObjectives(ProjectProfile profile, String ticketId) {
        String author = memberName(profile, "alex", "автора PR");
        return List.of(
                new TaskObjective("obj-read-pr-" + ticketId, ObjectiveType.REVIEW_CODE,
                        "Посмотреть diff " + ticketId + " в IntelliJ (Run tests)"),
                new TaskObjective("obj-reply-review-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Ответить " + author + " в Slack", "alex", null, "review-approve"),
                new TaskObjective("obj-jira-cr-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Перевести " + ticketId + " в Done в JIRA")
        );
    }

    private static InteractiveTask codeReviewMethod247(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-247",
                "Code Review: PaymentGateway — " + memberName(profile, "alex", "коллега"),
                "340 строк diff в " + profile.companyName() + ". Метод charge() на 80 строк.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_METHOD, 1,
                codeReviewObjectives(profile, "PR-247"),
                new CodeChallenge(
                        "PaymentGateway.java",
                        """
                        public class PaymentGateway {

                            // PR #247 — 80 строк в одном методе
                            public PaymentResult charge(PaymentRequest request) {
                                validate(request);
                                double amount = request.getAmount();
                                String currency = request.getCurrency();
                                // ... 70 строк логики ...
                                if (amount <= 0) throw new IllegalArgumentException("amount");
                                return new PaymentResult(true, "OK");
                            }

                            private void validate(PaymentRequest r) { /* ... */ }
                        }
                        """,
                        "Предложите вынести логику или одобрите.",
                        List.of(), List.of()
                ),
                codeReviewMethodReplies()
        );
    }

    private static InteractiveTask codeReviewMethod248(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-248",
                "Code Review: OrderProcessor — god method",
                memberName(profile, "alex", "Коллега") + " добавил processOrder() на 120 строк в " + profile.productName() + ".",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_METHOD, 1,
                codeReviewObjectives(profile, "PR-248"),
                new CodeChallenge(
                        "OrderProcessor.java",
                        """
                        public class OrderProcessor {

                            public void processOrder(Order order) {
                                // PR #248 — validation + pricing + inventory + notify
                                validateOrder(order);
                                calculateDiscount(order);
                                reserveStock(order);
                                chargePayment(order);
                                sendConfirmation(order);
                                updateAnalytics(order);
                                // ... ещё 80 строк ...
                            }
                        }
                        """,
                        "Разбейте god method на отдельные сервисы.",
                        List.of(), List.of()
                ),
                codeReviewMethodReplies()
        );
    }

    private static InteractiveTask codeReviewMethod249(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-249",
                "Code Review: RefundHandler — nested if",
                "5 уровней вложенности в refund logic.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_METHOD, 1,
                codeReviewObjectives(profile, "PR-249"),
                new CodeChallenge(
                        "RefundHandler.java",
                        """
                        public class RefundHandler {

                            public RefundResult handle(RefundRequest req) {
                                if (req != null) {
                                    if (req.isValid()) {
                                        if (req.getOrderId() != null) {
                                            if (orderExists(req.getOrderId())) {
                                                // ... ещё 3 уровня ...
                                                return process(req);
                                            }
                                        }
                                    }
                                }
                                return RefundResult.failed();
                            }
                        }
                        """,
                        "Early return или guard clauses вместо pyramid of doom.",
                        List.of(), List.of()
                ),
                codeReviewMethodReplies()
        );
    }

    private static List<ReplyOption> codeReviewMethodReplies() {
        return List.of(
                new ReplyOption("review-refactor",
                        "Логика верна, но метод слишком большой — вынеси валидацию и расчёт.",
                        true, "«Согласен, рефакторну 👍»"),
                new ReplyOption("review-approve",
                        "LGTM, approve ✅",
                        true, "«Спасибо за быстрое ревью!»"),
                new ReplyOption("review-reject",
                        "Reject. Перепиши всё с нуля.",
                        false, "«Это слишком, давай конструктивнее 😅» (+стресс)")
        );
    }

    private static InteractiveTask codeReviewStyle251(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-251",
                "Code Review: naming & formatting",
                "Inconsistent naming в dto layer " + profile.companyName() + ".",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_STYLE, 1,
                codeReviewObjectives(profile, "PR-251"),
                new CodeChallenge(
                        "UserDto.java",
                        """
                        public class UserDto {
                            public String usr_nm;
                            public String eml_addr;
                            public int AGE;
                            // mixed camelCase, snake_case, SCREAMING
                        }
                        """,
                        "Приведите к Java naming conventions.",
                        List.of(), List.of()
                ),
                codeReviewStyleReplies()
        );
    }

    private static InteractiveTask codeReviewStyle252(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-252",
                "Code Review: magic numbers",
                "Hardcoded 86400, 1000, 0.19 в TaxCalculator.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_STYLE, 1,
                codeReviewObjectives(profile, "PR-252"),
                new CodeChallenge(
                        "TaxCalculator.java",
                        """
                        public class TaxCalculator {
                            public double calc(double amount) {
                                if (amount > 1000) {
                                    return amount * 0.19 + 86400 * 0.001;
                                }
                                return amount * 0.19;
                            }
                        }
                        """,
                        "Вынесите magic numbers в named constants.",
                        List.of(), List.of()
                ),
                codeReviewStyleReplies()
        );
    }

    private static InteractiveTask codeReviewStyle253(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-253",
                "Code Review: dead code",
                "Закомментированный код и unused imports.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_STYLE, 1,
                codeReviewObjectives(profile, "PR-253"),
                new CodeChallenge(
                        "LegacyAdapter.java",
                        """
                        public class LegacyAdapter {
                            // public void oldMethod() { ... 50 lines commented ... }
                            // TODO: delete after migration — 6 months ago
                            public void adapt(Request r) {
                                /* if (legacy) { ... } */
                                return newAdapter.adapt(r);
                            }
                        }
                        """,
                        "Удалите dead code перед merge.",
                        List.of(), List.of()
                ),
                codeReviewStyleReplies()
        );
    }

    private static List<ReplyOption> codeReviewStyleReplies() {
        return List.of(
                new ReplyOption("review-approve",
                        "Naming/formatting — поправь перед merge, остальное OK.",
                        true, "«Поправлю в следующем коммите 👍»"),
                new ReplyOption("review-nitpick",
                        "Мелочи, LGTM ✅",
                        true, "«Спасибо!»"),
                new ReplyOption("review-reject",
                        "Reject — это не стиль, это хаос.",
                        false, "«Ок, давай конструктивнее» (+стресс)")
        );
    }

    private static InteractiveTask codeReviewSecurity261(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-261",
                "Code Review: SQL injection risk",
                "String concat в native query — security review.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_SECURITY, 1,
                codeReviewObjectives(profile, "PR-261"),
                new CodeChallenge(
                        "UserRepository.java",
                        """
                        @Repository
                        public class UserRepository {
                            public User findByEmail(String email) {
                                // PR #261 — SQL injection!
                                String sql = "SELECT * FROM users WHERE email = '" + email + "'";
                                return jdbcTemplate.queryForObject(sql, User.class);
                            }
                        }
                        """,
                        "Используйте parameterized query / PreparedStatement.",
                        List.of(), List.of()
                ),
                codeReviewSecurityReplies()
        );
    }

    private static InteractiveTask codeReviewSecurity262(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-262",
                "Code Review: hardcoded credentials",
                "API key в source code — блокер для merge.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_SECURITY, 1,
                codeReviewObjectives(profile, "PR-262"),
                new CodeChallenge(
                        "PaymentClient.java",
                        """
                        public class PaymentClient {
                            private static final String API_KEY = "sk_live_abc123xyz";
                            public void charge(double amount) {
                                http.post("/charge", API_KEY, amount);
                            }
                        }
                        """,
                        "Credentials в Vault/env, не в коде.",
                        List.of(), List.of()
                ),
                codeReviewSecurityReplies()
        );
    }

    private static InteractiveTask codeReviewSecurity263(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-263",
                "Code Review: missing auth check",
                "Admin endpoint без @PreAuthorize.",
                TaskType.CODE_REVIEW, ScenarioTag.CODE_REVIEW_SECURITY, 1,
                codeReviewObjectives(profile, "PR-263"),
                new CodeChallenge(
                        "AdminController.java",
                        """
                        @RestController
                        @RequestMapping("/api/admin")
                        public class AdminController {
                            @DeleteMapping("/users/{id}")
                            public void deleteUser(@PathVariable Long id) {
                                // BUG: no authorization check
                                userService.delete(id);
                            }
                        }
                        """,
                        "Добавьте @PreAuthorize или role check.",
                        List.of(), List.of()
                ),
                codeReviewSecurityReplies()
        );
    }

    private static List<ReplyOption> codeReviewSecurityReplies() {
        return List.of(
                new ReplyOption("review-block",
                        "Block merge — security issue. Нужен parameterized query / Vault.",
                        true, "«Согласен, это blocker 🔒»"),
                new ReplyOption("review-approve",
                        "LGTM, approve.",
                        false, "«Тут SQL injection — нельзя merge» (+стресс)"),
                new ReplyOption("review-later",
                        "Пофиксим после релиза.",
                        false, "«Security не ждёт релиза» (+стресс)")
        );
    }

    // --- Production incidents (race condition) ---

    private static List<InteractiveTask> productionIncidentPool(ProjectProfile profile) {
        return List.of(
                productionRace501(profile),
                productionRace502(profile),
                productionRace503(profile),
                productionRace504(profile)
        );
    }

    private static List<TaskObjective> productionObjectives(ProjectProfile profile, String ticketId) {
        String devopsName = memberName(profile, "dmitry", "DevOps");
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать алерт от " + devopsName, "dmitry",
                        ScenarioLibrary.incMessageId(ticketId), null),
                new TaskObjective("obj-fix-" + ticketId, ObjectiveType.SUBMIT_FIX,
                        "Исправить race condition и закоммитить"),
                new TaskObjective("obj-push-" + ticketId, ObjectiveType.GIT_PUSH,
                        "Запушить hotfix в origin"),
                new TaskObjective("obj-pr-" + ticketId, ObjectiveType.CREATE_PR,
                        "Создать Pull Request (hotfix)"),
                requestReviewObjective(profile, ticketId),
                new TaskObjective("obj-merge-" + ticketId, ObjectiveType.MERGE_PR,
                        "Влить hotfix: IntelliJ → Git → git merge"),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Отписаться " + devopsName + " о деплое", "dmitry", null, "reply-deployed"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Закрыть " + ticketId)
        );
    }

    private static InteractiveTask productionRace501(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-501",
                "🔥 500 на checkout в PRODUCTION",
                "PagerDuty SEV-1 в " + profile.companyName() + ". Race condition в PaymentService.",
                TaskType.PRODUCTION_BUG, ScenarioTag.RACE_CONDITION, 3,
                productionObjectives(profile, "INC-501"),
                paymentServiceRaceChallenge("balance = balance + amount"),
                productionReplies()
        );
    }

    private static InteractiveTask productionRace502(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-505",
                "🔥 Double charge на /pay",
                "Concurrent requests — balance corruption в " + profile.productName() + ".",
                TaskType.PRODUCTION_BUG, ScenarioTag.RACE_CONDITION, 3,
                productionObjectives(profile, "INC-505"),
                paymentServiceRaceChallenge("counter++"),
                productionReplies()
        );
    }

    private static InteractiveTask productionRace503(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-508",
                "🔥 Lost updates в WalletService",
                "Race на incrementBalance — клиенты теряют деньги.",
                TaskType.PRODUCTION_BUG, ScenarioTag.RACE_CONDITION, 3,
                productionObjectives(profile, "INC-508"),
                walletServiceRaceChallenge(),
                productionReplies()
        );
    }

    private static InteractiveTask productionRace504(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-512",
                "🔥 Inventory oversell",
                "Concurrent decrement stock — sold more than available.",
                TaskType.PRODUCTION_BUG, ScenarioTag.RACE_CONDITION, 3,
                productionObjectives(profile, "INC-512"),
                inventoryRaceChallenge(),
                productionReplies()
        );
    }

    private static CodeChallenge paymentServiceRaceChallenge(String buggyLine) {
        return new CodeChallenge(
                "PaymentService.java",
                """
                public class PaymentService {
                    private int balance = 0;

                    public void process(int amount) {
                        // BUG: race condition — не atomic
                        %s;
                    }

                    public int getBalance() {
                        return balance;
                    }
                }
                """.formatted(buggyLine),
                "Сделайте операцию атомарной (synchronized или AtomicInteger)",
                List.of("synchronized", "AtomicInteger"),
                List.of(buggyLine)
        );
    }

    private static CodeChallenge walletServiceRaceChallenge() {
        return new CodeChallenge(
                "WalletService.java",
                """
                public class WalletService {
                    private int counter = 0;

                    public void incrementBalance(int amount) {
                        // BUG: race condition
                        counter++;
                    }
                }
                """,
                "Сделайте increment атомарным (synchronized или AtomicInteger)",
                List.of("synchronized", "AtomicInteger"),
                List.of("counter++")
        );
    }

    private static CodeChallenge inventoryRaceChallenge() {
        return new CodeChallenge(
                "InventoryService.java",
                """
                public class InventoryService {
                    private int stock = 100;

                    public void decrementStock() {
                        // BUG: check-then-act race
                        if (stock > 0) {
                            stock = stock - 1;
                        }
                    }
                }
                """,
                "Сделайте decrement атомарным (synchronized или AtomicInteger)",
                List.of("synchronized", "AtomicInteger"),
                List.of("stock = stock - 1")
        );
    }

    private static List<ReplyOption> productionReplies() {
        return List.of(
                new ReplyOption("reply-deployed",
                        "Hotfix задеплоен на prod. Grafana зелёная.",
                        true, "Дмитрий: «Вижу, метрики в норме. Спасибо!»"),
                new ReplyOption("reply-investigating",
                        "Ещё разбираюсь, нужно время.",
                        false, "Дмитрий: «SEV-1! Клиенты не могут платить!» (+стресс)")
        );
    }

    // --- Memory leak pool ---

    private static List<InteractiveTask> memoryLeakPool(ProjectProfile profile) {
        return List.of(
                memoryLeak502(profile),
                memoryLeak503(profile),
                memoryLeak504(profile),
                memoryLeak505(profile)
        );
    }

    private static List<TaskObjective> memoryLeakObjectives(ProjectProfile profile, String ticketId) {
        String devopsName = memberName(profile, "dmitry", "DevOps");
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать алерт от " + devopsName + " в Slack", "dmitry",
                        ScenarioLibrary.oomMessageId(ticketId), null),
                new TaskObjective("obj-grafana-" + ticketId, ObjectiveType.CHECK_METRICS,
                        "Grafana: проверить heap (монотонный рост?)", "grafana", "heap-chart", null),
                new TaskObjective("obj-k8s-" + ticketId, ObjectiveType.CHECK_METRICS,
                        "K8s: pod OOMKilled / лимиты памяти", "kubernetes", "oom-status", null),
                new TaskObjective("obj-heap-" + ticketId, ObjectiveType.HEAP_DUMP,
                        "Снять heap dump с pod", "kubernetes", "heap-dump", null),
                new TaskObjective("obj-fix-" + ticketId, ObjectiveType.SUBMIT_FIX,
                        "Исправить утечку памяти и закоммитить"),
                new TaskObjective("obj-push-" + ticketId, ObjectiveType.GIT_PUSH,
                        "Запушить fix в origin"),
                new TaskObjective("obj-pr-" + ticketId, ObjectiveType.CREATE_PR,
                        "Создать Pull Request"),
                requestReviewObjective(profile, ticketId),
                new TaskObjective("obj-merge-" + ticketId, ObjectiveType.MERGE_PR,
                        "Влить PR: IntelliJ → Git → git checkout main → git merge"),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Отписаться " + devopsName, "dmitry", null, "oom-fixed"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Закрыть " + ticketId)
        );
    }

    private static InteractiveTask memoryLeak502(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-502",
                "🔥 OOMKilled — checkout-api memory leak",
                "Pod убит OOMKiller. Static cache в UserCacheService.",
                TaskType.PRODUCTION_BUG, ScenarioTag.MEMORY_LEAK, 3,
                memoryLeakObjectives(profile, "INC-502"),
                userCacheLeakChallenge("UserProfile"),
                memoryLeakReplies()
        );
    }

    private static InteractiveTask memoryLeak503(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-503",
                "🔥 Heap monotonic growth — SessionCache",
                "Heap dump: миллионы SessionDto в " + profile.companyName() + ".",
                TaskType.PRODUCTION_BUG, ScenarioTag.MEMORY_LEAK, 3,
                memoryLeakObjectives(profile, "INC-503"),
                userCacheLeakChallenge("SessionDto"),
                memoryLeakReplies()
        );
    }

    private static InteractiveTask memoryLeak504(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-504",
                "🔥 OOM в api-gateway pod",
                "Unbounded static List в TokenCacheService.",
                TaskType.PRODUCTION_BUG, ScenarioTag.MEMORY_LEAK, 3,
                memoryLeakObjectives(profile, "INC-504"),
                tokenCacheLeakChallenge(),
                memoryLeakReplies()
        );
    }

    private static InteractiveTask memoryLeak505(ProjectProfile profile) {
        return new InteractiveTask(
                "INC-506",
                "🔥 Memory leak в profile-service",
                "AvatarCache растёт без TTL — K8s restart loop.",
                TaskType.PRODUCTION_BUG, ScenarioTag.MEMORY_LEAK, 3,
                memoryLeakObjectives(profile, "INC-506"),
                avatarCacheLeakChallenge(),
                memoryLeakReplies()
        );
    }

    private static CodeChallenge userCacheLeakChallenge(String typeName) {
        return new CodeChallenge(
                "UserCacheService.java",
                """
                @Service
                public class UserCacheService {

                    // BUG: static cache — утечка, heap растёт монотонно
                    private static final List<%s> CACHE = new ArrayList<>();

                    public %s getUser(String id) {
                        return CACHE.stream()
                                .filter(u -> u.getId().equals(id))
                                .findFirst()
                                .orElseGet(() -> {
                                    %s u = userClient.fetch(id);
                                    CACHE.add(u);
                                    return u;
                                });
                    }
                }
                """.formatted(typeName, typeName, typeName),
                "Уберите static cache или добавьте LRU/Caffeine с maxSize и TTL.",
                List.of("Caffeine", "maxSize", "LRU", "CACHE.clear", "new ConcurrentHashMap"),
                List.of("private static final List")
        );
    }

    private static CodeChallenge tokenCacheLeakChallenge() {
        return new CodeChallenge(
                "TokenCacheService.java",
                """
                @Service
                public class TokenCacheService {

                    private static final List<String> CACHE = new ArrayList<>();

                    public String getToken(String clientId) {
                        String token = fetchToken(clientId);
                        CACHE.add(token);
                        return token;
                    }
                }
                """,
                "Замените unbounded static List на Caffeine с maxSize/TTL.",
                List.of("Caffeine", "maxSize", "LRU", "CACHE.clear"),
                List.of("private static final List")
        );
    }

    private static CodeChallenge avatarCacheLeakChallenge() {
        return new CodeChallenge(
                "AvatarCacheService.java",
                """
                @Service
                public class AvatarCacheService {

                    private static final List<byte[]> CACHE = new ArrayList<>();

                    public byte[] getAvatar(String userId) {
                        byte[] data = storage.fetch(userId);
                        CACHE.add(data);
                        return data;
                    }
                }
                """,
                "Ограничьте cache: Caffeine с maxSize или weak references.",
                List.of("Caffeine", "maxSize", "LRU", "CACHE.clear"),
                List.of("private static final List")
        );
    }

    private static List<ReplyOption> memoryLeakReplies() {
        return List.of(
                new ReplyOption("oom-fixed",
                        "Heap dump снят. Static cache заменил на Caffeine с TTL.",
                        true, "Дмитрий: «Heap стабилизировался. Pod Running 20 min+ 👍»"),
                new ReplyOption("oom-restart",
                        "Просто перезапустил pod.",
                        false, "Дмитрий: «Через час снова OOMKilled. Нужен root cause» (+стресс)")
        );
    }

    // --- Kafka pool ---

    private static List<InteractiveTask> kafkaTaskPool(ProjectProfile profile) {
        return List.of(
                kafkaLag101(profile),
                kafkaLag102(profile),
                kafkaLag103(profile),
                kafkaLag104(profile)
        );
    }

    private static List<TaskObjective> kafkaObjectives(ProjectProfile profile, String ticketId) {
        String devopsName = memberName(profile, "dmitry", "DevOps");
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать алерт Kafka от " + devopsName, "dmitry",
                        ScenarioLibrary.kafkaMessageId(ticketId), null),
                new TaskObjective("obj-kafka-lag-" + ticketId, ObjectiveType.CHECK_METRICS,
                        "Kafka: consumer lag", "kafka", "consumer-lag", null),
                new TaskObjective("obj-grafana-" + ticketId, ObjectiveType.CHECK_METRICS,
                        "Grafana: ошибки и latency payment-gateway", "grafana", "integration-metrics", null),
                new TaskObjective("obj-kibana-" + ticketId, ObjectiveType.CHECK_METRICS,
                        "Kibana: 504 от внешней интеграции", "opensearch", "integration-errors", null),
                new TaskObjective("obj-fix-" + ticketId, ObjectiveType.SUBMIT_FIX,
                        "Исправить retry/backoff и закоммитить"),
                new TaskObjective("obj-push-" + ticketId, ObjectiveType.GIT_PUSH,
                        "Запушить ветку в origin"),
                new TaskObjective("obj-pr-" + ticketId, ObjectiveType.CREATE_PR,
                        "Создать Pull Request"),
                requestReviewObjective(profile, ticketId),
                new TaskObjective("obj-merge-" + ticketId, ObjectiveType.MERGE_PR,
                        "Влить PR: IntelliJ → Git → git checkout main → git merge"),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Отписаться " + devopsName, "dmitry", null, "kafka-fixed"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Закрыть " + ticketId)
        );
    }

    private static InteractiveTask kafkaLag101(ProjectProfile profile) {
        return new InteractiveTask(
                "KAFKA-101",
                "📨 Consumer lag 1800+ — orders.created",
                "checkout-service не успевает. payment-gateway 504 в логах.",
                TaskType.PRODUCTION_BUG, ScenarioTag.KAFKA_CONSUMER, 2,
                kafkaObjectives(profile, "KAFKA-101"),
                orderEventConsumerChallenge("orders.created"),
                kafkaReplies()
        );
    }

    private static InteractiveTask kafkaLag102(ProjectProfile profile) {
        return new InteractiveTask(
                "KAFKA-102",
                "📨 Lag payments.processed — 2400 messages",
                "PaymentEventConsumer блокируется на external API в " + profile.companyName() + ".",
                TaskType.PRODUCTION_BUG, ScenarioTag.KAFKA_CONSUMER, 2,
                kafkaObjectives(profile, "KAFKA-102"),
                orderEventConsumerChallenge("payments.processed"),
                kafkaReplies()
        );
    }

    private static InteractiveTask kafkaLag103(ProjectProfile profile) {
        return new InteractiveTask(
                "KAFKA-103",
                "📨 DLQ overflow — inventory.updated",
                "Consumer stall без retry policy.",
                TaskType.PRODUCTION_BUG, ScenarioTag.KAFKA_CONSUMER, 2,
                kafkaObjectives(profile, "KAFKA-103"),
                inventoryEventConsumerChallenge(),
                kafkaReplies()
        );
    }

    private static InteractiveTask kafkaLag104(ProjectProfile profile) {
        return new InteractiveTask(
                "KAFKA-104",
                "📨 Consumer group rebalancing storm",
                "Sync charge() блокирует partition в " + profile.productName() + ".",
                TaskType.PRODUCTION_BUG, ScenarioTag.KAFKA_CONSUMER, 2,
                kafkaObjectives(profile, "KAFKA-104"),
                orderEventConsumerChallenge("checkout.completed"),
                kafkaReplies()
        );
    }

    private static CodeChallenge orderEventConsumerChallenge(String topic) {
        return new CodeChallenge(
                "OrderEventConsumer.java",
                """
                @KafkaListener(topics = "%s")
                public void onOrderCreated(OrderEvent event) {
                    // BUG: синхронный вызов без retry — payment-gateway 504 блокирует consumer
                    paymentGatewayClient.charge(event.getOrderId(), event.getAmount());
                    orderRepository.markPaid(event.getOrderId());
                }
                """.formatted(topic),
                "Добавьте @Retryable или async + DLQ. При 504 не блокируйте offset.",
                List.of("@Retryable", "RetryTemplate", "deadLetter", "nack", "try {"),
                List.of("paymentGatewayClient.charge(event.getOrderId()")
        );
    }

    private static CodeChallenge inventoryEventConsumerChallenge() {
        return new CodeChallenge(
                "InventoryEventConsumer.java",
                """
                @KafkaListener(topics = "inventory.updated")
                public void onInventoryUpdated(InventoryEvent event) {
                    // BUG: no retry on warehouse API failure
                    paymentGatewayClient.charge(event.getSku(), event.getQty());
                    warehouseClient.sync(event);
                }
                """,
                "Добавьте retry/backoff и DLQ для failed messages.",
                List.of("@Retryable", "RetryTemplate", "deadLetter", "nack", "try {"),
                List.of("paymentGatewayClient.charge")
        );
    }

    private static List<ReplyOption> kafkaReplies() {
        return List.of(
                new ReplyOption("kafka-fixed",
                        "Lag сошёл. Добавил retry + DLQ, payment-gateway восстановился.",
                        true, "Дмитрий: «Consumer group caught up. Lag 0»"),
                new ReplyOption("kafka-reset",
                        "Сделал kafka-consumer-groups --reset-offsets.",
                        false, "Дмитрий: «Offsets reset — потеряли 200 orders. Эскалация» (+стресс)")
        );
    }

    // --- Observability pool (METRICS_SLA, no code) ---

    private static List<InteractiveTask> observabilityPool(ProjectProfile profile) {
        return List.of(
                observability101(profile),
                observability102(profile),
                observability103(profile)
        );
    }

    private static InteractiveTask observability101(ProjectProfile profile) {
        return new InteractiveTask(
                "OBS-101",
                "📊 Профилирование внешних интеграций",
                "Grafana + Kibana: SLA партнёров, error rate, response time.",
                TaskType.REFACTORING, ScenarioTag.METRICS_SLA, 1,
                List.of(
                        new TaskObjective("obj-read-obs101", ObjectiveType.READ_EMAIL,
                                "Outlook: письмо Grafana Alert — SLA интеграций", null, "email-obs-sla", null),
                        new TaskObjective("obj-grafana-obs101", ObjectiveType.CHECK_METRICS,
                                "Grafana: error rate + p99 latency партнёров", "grafana", "integration-dashboard", null),
                        new TaskObjective("obj-prom-obs101", ObjectiveType.CHECK_METRICS,
                                "Prometheus: up{job=\"partner-api\"}", "prometheus", "partner-up", null),
                        new TaskObjective("obj-reply-obs101", ObjectiveType.REPLY_MESSAGE,
                                "Отчёт Igor PM", "igor", null, "obs-report"),
                        new TaskObjective("obj-jira-obs101", ObjectiveType.CLOSE_JIRA,
                                "Закрыть OBS-101")
                ),
                null,
                List.of(new ReplyOption("obs-report",
                        "Partner API: error rate 2.1%, p99 890ms. Рекомендую circuit breaker.",
                        true, "Игорь: «Спасибо, занесу в backlog»"))
        );
    }

    private static InteractiveTask observability102(ProjectProfile profile) {
        return new InteractiveTask(
                "OBS-102",
                "📊 SLA breach — payment-gateway p99 > 2s",
                "Alertmanager: SLO violation в " + profile.companyName() + ".",
                TaskType.REFACTORING, ScenarioTag.METRICS_SLA, 1,
                List.of(
                        new TaskObjective("obj-read-obs102", ObjectiveType.READ_EMAIL,
                                "Outlook: SLO alert от Grafana", null, "email-obs-slo", null),
                        new TaskObjective("obj-grafana-obs102", ObjectiveType.CHECK_METRICS,
                                "Grafana: p99 latency dashboard", "grafana", "p99-dashboard", null),
                        new TaskObjective("obj-prom-obs102", ObjectiveType.CHECK_METRICS,
                                "Prometheus: histogram_quantile(0.99, ...)", "prometheus", "p99-query", null),
                        new TaskObjective("obj-reply-obs102", ObjectiveType.REPLY_MESSAGE,
                                "Отчёт PM о root cause", "igor", null, "obs-slo-report"),
                        new TaskObjective("obj-jira-obs102", ObjectiveType.CLOSE_JIRA,
                                "Закрыть OBS-102")
                ),
                null,
                List.of(new ReplyOption("obs-slo-report",
                        "p99 2.3s — bottleneck в partner timeout. Рекомендую async + timeout tuning.",
                        true, "Игорь: «Занесу в sprint planning»"))
        );
    }

    private static InteractiveTask observability103(ProjectProfile profile) {
        return new InteractiveTask(
                "OBS-103",
                "📊 Error budget exhausted — checkout-api",
                "SRE review: 99.9% SLO за месяц на грани в " + profile.productName() + ".",
                TaskType.REFACTORING, ScenarioTag.METRICS_SLA, 1,
                List.of(
                        new TaskObjective("obj-read-obs103", ObjectiveType.READ_MESSAGE,
                                "Прочитать алерт SRE в Slack", "igor",
                                ScenarioLibrary.obsMessageId("OBS-103"), null),
                        new TaskObjective("obj-grafana-obs103", ObjectiveType.CHECK_METRICS,
                                "Grafana: error budget burn rate", "grafana", "error-budget", null),
                        new TaskObjective("obj-kibana-obs103", ObjectiveType.CHECK_METRICS,
                                "Kibana: top 5xx errors last 24h", "opensearch", "5xx-errors", null),
                        new TaskObjective("obj-reply-obs103", ObjectiveType.REPLY_MESSAGE,
                                "Отчёт Igor PM", "igor", null, "obs-budget-report"),
                        new TaskObjective("obj-jira-obs103", ObjectiveType.CLOSE_JIRA,
                                "Закрыть OBS-103")
                ),
                null,
                List.of(new ReplyOption("obs-budget-report",
                        "Burn rate 3x — рекомендую freeze deploys + fix top 5xx.",
                        true, "Игорь: «Согласовано с SRE»"))
        );
    }

    // --- SQL pool (SQL_SLOW_QUERY, no code) ---

    private static List<InteractiveTask> sqlTaskPool(ProjectProfile profile) {
        return List.of(
                sqlSlow201(profile),
                sqlSlow202(profile),
                sqlSlow203(profile)
        );
    }

    private static InteractiveTask sqlSlow201(ProjectProfile profile) {
        return new InteractiveTask(
                "SQL-201",
                "🐢 Slow query — orders table full scan",
                "pg_stat_statements: SELECT * FROM orders без index в " + profile.companyName() + ".",
                TaskType.REFACTORING, ScenarioTag.SQL_SLOW_QUERY, 1,
                List.of(
                        new TaskObjective("obj-read-sql201", ObjectiveType.READ_MESSAGE,
                                "Прочитать алерт DBA в Slack", "igor",
                                ScenarioLibrary.obsMessageId("SQL-201"), null),
                        new TaskObjective("obj-grafana-sql201", ObjectiveType.CHECK_METRICS,
                                "Grafana: query duration p99", "grafana", "pg-slow-queries", null),
                        new TaskObjective("obj-explain-sql201", ObjectiveType.CHECK_METRICS,
                                "EXPLAIN ANALYZE в pgAdmin", "postgresql", "explain-orders", null),
                        new TaskObjective("obj-reply-sql201", ObjectiveType.REPLY_MESSAGE,
                                "Отчёт DBA с рекомендацией", "dmitry", null, "sql-index-report"),
                        new TaskObjective("obj-jira-sql201", ObjectiveType.CLOSE_JIRA,
                                "Закрыть SQL-201")
                ),
                null,
                List.of(new ReplyOption("sql-index-report",
                        "Seq Scan на 2M rows — нужен index на (customer_id, created_at).",
                        true, "Дмитрий: «Создам index в maintenance window»"))
        );
    }

    private static InteractiveTask sqlSlow202(ProjectProfile profile) {
        return new InteractiveTask(
                "SQL-202",
                "🐢 N+1 query в OrderRepository",
                "Hibernate генерирует 500+ queries на один request.",
                TaskType.REFACTORING, ScenarioTag.SQL_SLOW_QUERY, 1,
                List.of(
                        new TaskObjective("obj-read-sql202", ObjectiveType.READ_EMAIL,
                                "Outlook: APM alert — query count spike", null, "email-sql-nplus1", null),
                        new TaskObjective("obj-apm-sql202", ObjectiveType.CHECK_METRICS,
                                "APM: SQL query count per request", "grafana", "nplus1-dashboard", null),
                        new TaskObjective("obj-reply-sql202", ObjectiveType.REPLY_MESSAGE,
                                "Отчёт " + memberName(profile, "alex", "разработчику") + " с рекомендацией @EntityGraph",
                                "alex", null, "sql-nplus1-report"),
                        new TaskObjective("obj-jira-sql202", ObjectiveType.CLOSE_JIRA,
                                "Закрыть SQL-202")
                ),
                null,
                List.of(new ReplyOption("sql-nplus1-report",
                        "N+1 на Order.items — добавить @EntityGraph или JOIN FETCH.",
                        true, "«Поправлю в hotfix PR»"))
        );
    }

    private static InteractiveTask sqlSlow203(ProjectProfile profile) {
        return new InteractiveTask(
                "SQL-203",
                "🐢 Lock contention — UPDATE users",
                "pg_locks: long-running transaction блокирует checkout в " + profile.productName() + ".",
                TaskType.REFACTORING, ScenarioTag.SQL_SLOW_QUERY, 1,
                List.of(
                        new TaskObjective("obj-read-sql203", ObjectiveType.READ_MESSAGE,
                                "Прочитать алерт DBA", "igor",
                                ScenarioLibrary.obsMessageId("SQL-203"), null),
                        new TaskObjective("obj-pg-sql203", ObjectiveType.CHECK_METRICS,
                                "pgAdmin: active locks & blocking queries", "postgresql", "pg-locks", null),
                        new TaskObjective("obj-reply-sql203", ObjectiveType.REPLY_MESSAGE,
                                "Отчёт: kill long transaction + optimize", "dmitry", null, "sql-lock-report"),
                        new TaskObjective("obj-jira-sql203", ObjectiveType.CLOSE_JIRA,
                                "Закрыть SQL-203")
                ),
                null,
                List.of(new ReplyOption("sql-lock-report",
                        "Blocking PID 8842 — long UPDATE без commit. Kill + add index.",
                        true, "Дмитрий: «Lock снят, checkout восстановлен»"))
        );
    }

    // --- Feature pool ---

    private static List<InteractiveTask> featureTaskPool(ProjectProfile profile) {
        return List.of(
                featureFilter201(profile),
                featureFilter202(profile),
                featurePagination211(profile),
                featurePagination212(profile),
                featureValidation221(profile),
                featureValidation222(profile)
        );
    }

    private static List<TaskObjective> featureObjectives(ProjectProfile profile, String ticketId, String implLabel) {
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать ТЗ от " + memberName(profile, "igor", "PM"), "igor",
                        ScenarioLibrary.featureMessageId(ticketId), null),
                new TaskObjective("obj-implement-" + ticketId, ObjectiveType.SUBMIT_FIX, implLabel),
                new TaskObjective("obj-push-" + ticketId, ObjectiveType.GIT_PUSH,
                        "Запушить feature-ветку в origin"),
                new TaskObjective("obj-pr-" + ticketId, ObjectiveType.CREATE_PR,
                        "Создать Pull Request в GitHub"),
                requestReviewObjective(profile, ticketId),
                new TaskObjective("obj-merge-" + ticketId, ObjectiveType.MERGE_PR,
                        "Влить PR: IntelliJ → Git → git checkout main → git merge"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Закрыть " + ticketId)
        );
    }

    private static InteractiveTask featureFilter201(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-201",
                "Фильтр по дате в GET /api/orders",
                "Product Owner: Must Have для релиза " + profile.productName() + ".",
                TaskType.FEATURE, ScenarioTag.FEATURE_FILTER, 3,
                featureObjectives(profile, "JIRA-201",
                        "Реализовать фильтр по дате и закоммитить"),
                featureFilterChallenge(),
                List.of()
        );
    }

    private static InteractiveTask featureFilter202(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-202",
                "Фильтр по статусу в GET /api/orders",
                "Фильтрация orders по status enum.",
                TaskType.FEATURE, ScenarioTag.FEATURE_FILTER, 3,
                featureObjectives(profile, "JIRA-202",
                        "Добавить @RequestParam status и фильтрацию"),
                featureStatusFilterChallenge(),
                List.of()
        );
    }

    private static InteractiveTask featurePagination211(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-211-F",
                "Pagination в GET /api/products",
                "Page/size параметры для каталога " + profile.companyName() + ".",
                TaskType.FEATURE, ScenarioTag.FEATURE_PAGINATION, 3,
                featureObjectives(profile, "JIRA-211-F",
                        "Добавить Pageable и закоммитить"),
                featurePaginationChallenge(),
                List.of()
        );
    }

    private static InteractiveTask featurePagination212(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-212",
                "Keyset pagination для /api/events",
                "Keyset pagination для high-volume feed.",
                TaskType.FEATURE, ScenarioTag.FEATURE_PAGINATION, 3,
                featureObjectives(profile, "JIRA-212",
                        "Реализовать cursor-based pagination"),
                featureKeysetPaginationChallenge(),
                List.of()
        );
    }

    private static InteractiveTask featureValidation221(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-221",
                "Bean Validation на CreateOrderRequest",
                "Добавить @NotNull, @Min, @Email constraints.",
                TaskType.FEATURE, ScenarioTag.FEATURE_VALIDATION, 3,
                featureObjectives(profile, "JIRA-221",
                        "Добавить validation annotations и закоммитить"),
                featureValidationChallenge(),
                List.of()
        );
    }

    private static InteractiveTask featureValidation222(ProjectProfile profile) {
        return new InteractiveTask(
                "JIRA-222",
                "Custom validator для phone number",
                "@Pattern + custom PhoneValidator для registration.",
                TaskType.FEATURE, ScenarioTag.FEATURE_VALIDATION, 3,
                featureObjectives(profile, "JIRA-222",
                        "Реализовать phone validation"),
                featurePhoneValidationChallenge(),
                List.of()
        );
    }

    private static CodeChallenge featureFilterChallenge() {
        return new CodeChallenge(
                "OrderController.java",
                """
                @RestController
                @RequestMapping("/api/orders")
                public class OrderController {

                    @GetMapping
                    public List<Order> getOrders() {
                        // TODO: добавить параметры fromDate и toDate
                        return orderService.findAll();
                    }
                }
                """,
                "Добавьте @RequestParam LocalDate fromDate, toDate и фильтрацию",
                List.of("@RequestParam", "fromDate", "toDate"),
                List.of("return orderService.findAll();")
        );
    }

    private static CodeChallenge featureStatusFilterChallenge() {
        return new CodeChallenge(
                "OrderController.java",
                """
                @RestController
                @RequestMapping("/api/orders")
                public class OrderController {

                    @GetMapping
                    public List<Order> getOrders() {
                        // TODO: filter by status
                        return orderService.findAll();
                    }
                }
                """,
                "Добавьте @RequestParam OrderStatus status и фильтрацию",
                List.of("@RequestParam", "status"),
                List.of("return orderService.findAll();")
        );
    }

    private static CodeChallenge featurePaginationChallenge() {
        return new CodeChallenge(
                "ProductController.java",
                """
                @RestController
                @RequestMapping("/api/products")
                public class ProductController {

                    @GetMapping
                    public List<Product> getProducts() {
                        // TODO: pagination
                        return productService.findAll();
                    }
                }
                """,
                "Добавьте Pageable или page/size параметры",
                List.of("Pageable", "page", "size"),
                List.of("return productService.findAll();")
        );
    }

    private static CodeChallenge featureKeysetPaginationChallenge() {
        return new CodeChallenge(
                "EventController.java",
                """
                @RestController
                @RequestMapping("/api/events")
                public class EventController {

                    @GetMapping
                    public List<Event> getEvents() {
                        // TODO: keyset pagination
                        return eventService.findAll();
                    }
                }
                """,
                "Добавьте cursor/limit параметры для keyset pagination",
                List.of("cursor", "limit", "after"),
                List.of("return eventService.findAll();")
        );
    }

    private static CodeChallenge featureValidationChallenge() {
        return new CodeChallenge(
                "CreateOrderRequest.java",
                """
                public class CreateOrderRequest {
                    private String customerEmail;
                    private Integer quantity;
                    private Double amount;
                    // TODO: add validation
                }
                """,
                "Добавьте @NotNull, @Min, @Email constraints",
                List.of("@NotNull", "@Min", "@Email", "@Valid"),
                List.of()
        );
    }

    private static CodeChallenge featurePhoneValidationChallenge() {
        return new CodeChallenge(
                "RegisterRequest.java",
                """
                public class RegisterRequest {
                    private String phone;
                    // TODO: validate phone format
                }
                """,
                "Добавьте @Pattern или custom PhoneValidator",
                List.of("@Pattern", "PhoneValidator", "Constraint"),
                List.of()
        );
    }

    // --- Interview review pool (TRANSACTIONAL_TRAP) ---

    private static List<InteractiveTask> interviewReviewPool(ProjectProfile profile) {
        return List.of(
                interviewTransactional301(profile),
                interviewTransactional302(profile),
                interviewTransactional303(profile)
        );
    }

    private static List<TaskObjective> interviewObjectives(ProjectProfile profile, String ticketId) {
        String author = memberName(profile, "alex", "автора PR");
        return List.of(
                new TaskObjective("obj-read-int-" + ticketId, ObjectiveType.REVIEW_CODE,
                        "Разобрать код " + ticketId + " в IntelliJ (Run tests)"),
                new TaskObjective("obj-reply-int-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Объяснить " + author + " проблему @Transactional", "alex", null, "int-transactional"),
                new TaskObjective("obj-jira-int-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Request changes для " + ticketId + " в JIRA")
        );
    }

    private static InteractiveTask interviewTransactional301(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-301",
                "Code Review: @Transactional trap (собеседование)",
                "Классический вопрос Middle Java: почему транзакция не откатывает debit?",
                TaskType.CODE_REVIEW, ScenarioTag.TRANSACTIONAL_TRAP, 1,
                interviewObjectives(profile, "PR-301"),
                transactionalTrapChallenge("chargePayment"),
                interviewReplies()
        );
    }

    private static InteractiveTask interviewTransactional302(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-302",
                "Code Review: self-invocation @Transactional",
                "placeOrder() вызывает private @Transactional — proxy bypass.",
                TaskType.CODE_REVIEW, ScenarioTag.TRANSACTIONAL_TRAP, 1,
                interviewObjectives(profile, "PR-302"),
                transactionalTrapChallenge("updateInventory"),
                interviewReplies()
        );
    }

    private static InteractiveTask interviewTransactional303(ProjectProfile profile) {
        return new InteractiveTask(
                "PR-303",
                "Code Review: rollback не покрывает debit",
                "Wallet debit в private method — типичный banking trap в " + profile.companyName() + ".",
                TaskType.CODE_REVIEW, ScenarioTag.TRANSACTIONAL_TRAP, 1,
                interviewObjectives(profile, "PR-303"),
                transactionalTrapChallenge("debitWallet"),
                interviewReplies()
        );
    }

    private static CodeChallenge transactionalTrapChallenge(String privateMethodName) {
        return new CodeChallenge(
                "OrderService.java",
                """
                @Service
                public class OrderService {

                    @Transactional
                    public void placeOrder(Order order) {
                        orderRepository.save(order);
                        %s(order);  // вызов private — прокси не сработает!
                    }

                    @Transactional
                    private void %s(Order order) {
                        walletClient.debit(order.getCustomerId(), order.getTotal());
                    }
                }
                """.formatted(privateMethodName, privateMethodName),
                "Spring @Transactional не работает на private методах и self-invocation. "
                        + "Исправьте: public method или вынесите в отдельный сервис.",
                List.of(),
                List.of()
        );
    }

    private static List<ReplyOption> interviewReplies() {
        return List.of(
                new ReplyOption("int-transactional",
                        "@Transactional на private method не сработает — "
                                + "нужен public метод или отдельный PaymentService.",
                        true, "«Именно это спрашивают на Middle+ 🎯»"),
                new ReplyOption("int-lgtm",
                        "LGTM, merge.",
                        false, "«Тут баг с транзакцией — rollback не покроет debit» (+стресс)"),
                new ReplyOption("int-nitpick",
                        "Переименуй переменные.",
                        false, "«Это не nit, это data consistency»")
        );
    }

    // --- Explorer mode (no code) ---

    public static InteractiveTask explorerWorkflowTask(ProjectProfile profile, int day) {
        return switch ((day - 1) % 3) {
            case 1 -> explorerWorkflowOrder(profile);
            case 2 -> explorerWorkflowStatus(profile);
            default -> explorerWorkflowCheckout(profile);
        };
    }

    public static InteractiveTask explorerReviewTask(ProjectProfile profile, int day) {
        return (day % 2 == 0) ? explorerReviewMethod(profile) : explorerReviewStyle(profile);
    }

    public static InteractiveTask explorerObserveTask(ProjectProfile profile, int day) {
        return explorerObserveMetrics(profile);
    }

    public static InteractiveTask randomExplorerBonusTask(ProjectProfile profile, int day, Random rnd,
                                                            Set<String> usedTicketIds) {
        List<InteractiveTask> candidates = new ArrayList<>();
        candidates.add(explorerWorkflowCheckout(profile));
        candidates.add(explorerWorkflowOrder(profile));
        candidates.add(explorerWorkflowStatus(profile));
        if (day >= 2) {
            candidates.add(explorerReviewMethod(profile));
            candidates.add(explorerReviewStyle(profile));
        }
        if (day >= 3) {
            candidates.add(explorerObserveMetrics(profile));
        }
        List<InteractiveTask> available = candidates.stream()
                .filter(t -> usedTicketIds == null || !usedTicketIds.contains(t.getTicketId()))
                .toList();
        if (available.isEmpty()) {
            return null;
        }
        return pickRandom(available, rnd);
    }

    private static CodeChallenge explorerBrief(String fileName, String body, String hint) {
        return new CodeChallenge(fileName, body, hint, List.of(), List.of());
    }

    private static List<TaskObjective> explorerWorkflowObjectives(ProjectProfile profile, String ticketId) {
        String qaName = memberName(profile, "maria", "QA");
        String msgId = ScenarioLibrary.bugMessageId(ticketId);
        return List.of(
                new TaskObjective("obj-read-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать сообщение от " + qaName + " в Slack", "maria", msgId, null),
                new TaskObjective("obj-guide-jira-" + ticketId, ObjectiveType.GUIDED_STEP,
                        "Открыть тикет в JIRA и взять в работу", null, "step-jira-open", null),
                new TaskObjective("obj-guide-brief-" + ticketId, ObjectiveType.GUIDED_STEP,
                        "Изучить краткое описание задачи (IntelliJ)", null, "step-read-brief", null),
                new TaskObjective("obj-reply-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Ответить " + qaName + " в Slack", "maria", null, "explorer-reply-ok"),
                new TaskObjective("obj-jira-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Закрыть " + ticketId + " в JIRA")
        );
    }

    private static List<ReplyOption> explorerWorkflowReplies() {
        return List.of(
                new ReplyOption("explorer-reply-ok",
                        "Понял суть, передам разработчикам / взял в работу ✅",
                        true, "Мария: «Спасибо! Жду апдейт в JIRA»"),
                new ReplyOption("explorer-reply-wait",
                        "Не понял, что делать",
                        false, "Мария: «Открой JIRA и краткое описание в IntelliJ — там всё по шагам» (+стресс)")
        );
    }

    private static InteractiveTask explorerWorkflowCheckout(ProjectProfile profile) {
        String ticket = "EXP-101";
        return new InteractiveTask(
                ticket,
                "Баг: оформление заказа падает",
                "Пользователь не может завершить покупку. Ваша роль — разобраться в процессе, не в коде.",
                TaskType.BUG_FIX, ScenarioTag.EXPLORER_WORKFLOW, 1,
                explorerWorkflowObjectives(profile, ticket),
                explorerBrief("Кратко о задаче.md",
                        """
                        ## Что случилось
                        После нажатия «Оплатить» страница зависает. Поддержка получила 12 жалоб за час.

                        ## Как устроен процесс (без кода)
                        1. **Slack** — QA или коллега описывает проблему.
                        2. **JIRA** — тикет с приоритетом; вы фиксируете статус для команды.
                        3. **Разработка** — инженеры чинят код (это не ваша часть в режиме «Знакомство»).
                        4. **JIRA Done** — задача закрыта, когда работа согласована.

                        ## Ваша задача сейчас
                        Понять контекст и сообщить QA, что тикет в работе. Код писать не нужно.
                        """,
                        "Прочитайте и нажмите «Понятно»"),
                explorerWorkflowReplies()
        );
    }

    private static InteractiveTask explorerWorkflowOrder(ProjectProfile profile) {
        String ticket = "EXP-102";
        return new InteractiveTask(
                ticket,
                "Инцидент: письма о заказе не уходят",
                "Клиенты не получают подтверждение. Нужно пройти цепочку: Slack → JIRA → ответ.",
                TaskType.BUG_FIX, ScenarioTag.EXPLORER_WORKFLOW, 1,
                explorerWorkflowObjectives(profile, ticket),
                explorerBrief("Кратко о задаче.md",
                        """
                        ## Симптом
                        Email «Ваш заказ принят» не приходит, хотя оплата прошла.

                        ## Роли в команде
                        - **QA (Мария)** — заводит баг и проверяет фикс.
                        - **Разработчик** — ищет причину в сервисе уведомлений.
                        - **Вы** — координируете: читаете Slack, обновляете JIRA, даёте статус.

                        ## Инструменты
                        Slack = общение. JIRA = учёт задач. IntelliJ в этом режиме = краткое описание задачи (guided brief), не редактор кода.
                        """,
                        "Нажмите «Понятно», когда прочитали"),
                explorerWorkflowReplies()
        );
    }

    private static InteractiveTask explorerWorkflowStatus(ProjectProfile profile) {
        String ticket = "EXP-103";
        return new InteractiveTask(
                ticket,
                "Запрос: статус по доработке каталога",
                "Продукт спрашивает, когда будет фикс фильтров. Ответьте через процесс, без техники.",
                TaskType.FEATURE, ScenarioTag.EXPLORER_WORKFLOW, 1,
                explorerWorkflowObjectives(profile, ticket),
                explorerBrief("Кратко о задаче.md",
                        """
                        ## Запрос
                        В каталоге не работает фильтр по цене. PM ждёт оценку сроков.

                        ## Что делает разработчик в реальной жизни
                        Оценивает сложность, пишет код, тесты, PR, code review.

                        ## Что делаете вы в режиме «Знакомство»
                        Следуете чеклисту слева: Slack → JIRA → краткое описание → ответ → Done.
                        Так вы учитесь **рабочему ритму**, а не синтаксису Java.
                        """,
                        "Это учебный сценарий — код не требуется"),
                explorerWorkflowReplies()
        );
    }

    private static List<TaskObjective> explorerReviewObjectives(ProjectProfile profile, String ticketId) {
        String author = memberName(profile, "alex", "коллеги");
        return List.of(
                new TaskObjective("obj-read-pr-" + ticketId, ObjectiveType.READ_MESSAGE,
                        "Прочитать запрос на review от " + author + " в Slack", "alex",
                        ScenarioLibrary.reviewMessageId(ticketId), null),
                new TaskObjective("obj-guide-review-" + ticketId, ObjectiveType.GUIDED_STEP,
                        "Изучить краткое описание " + ticketId + " (IntelliJ)", null, "step-read-brief", null),
                new TaskObjective("obj-reply-review-" + ticketId, ObjectiveType.REPLY_MESSAGE,
                        "Ответить " + author + " в Slack", "alex", null, "explorer-review-ok"),
                new TaskObjective("obj-jira-cr-" + ticketId, ObjectiveType.CLOSE_JIRA,
                        "Перевести " + ticketId + " в Done в JIRA")
        );
    }

    private static List<ReplyOption> explorerReviewReplies() {
        return List.of(
                new ReplyOption("explorer-review-ok",
                        "Идея ок, но метод слишком большой — попросил бы разбить 👍",
                        true, "«Согласен, рефакторну»"),
                new ReplyOption("explorer-review-approve",
                        "LGTM, с моей стороны approve ✅",
                        true, "«Спасибо за ревью!»"),
                new ReplyOption("explorer-review-rude",
                        "Всё плохо, переписать",
                        false, "«Давай конструктивнее» (+стресс)")
        );
    }

    private static InteractiveTask explorerReviewMethod(ProjectProfile profile) {
        String ticket = "EXP-201";
        return new InteractiveTask(
                ticket,
                "Code review: слишком длинный метод",
                "Коллега прислал PR. Оцените идею простыми словами — код не правим.",
                TaskType.CODE_REVIEW, ScenarioTag.EXPLORER_REVIEW, 1,
                explorerReviewObjectives(profile, ticket),
                explorerBrief("Что такое code review.md",
                        """
                        ## Code review — это не экзамен по коду
                        Коллега показывает **черновик изменений** (Pull Request). Вы смотрите:
                        - Понятна ли цель?
                        - Не слишком ли рискованно?
                        - Можно ли проще?

                        ## В этом PR
                        Один метод делает всё: проверка, расчёт, оплата, уведомление.
                        В реальной команде попросили бы **разбить на шаги** — так проще тестировать.

                        ## Ваша задача
                        Ответить в Slack конструктивно. В JIRA — закрыть пункт review.
                        """,
                        "Нажмите «Понятно» после прочтения"),
                explorerReviewReplies()
        );
    }

    private static InteractiveTask explorerReviewStyle(ProjectProfile profile) {
        String ticket = "EXP-202";
        return new InteractiveTask(
                ticket,
                "Code review: имена и читаемость",
                "PR с неудачными именами полей. Объясните, что бы вы сказали команде.",
                TaskType.CODE_REVIEW, ScenarioTag.EXPLORER_REVIEW, 1,
                explorerReviewObjectives(profile, ticket),
                explorerBrief("Что такое code review.md",
                        """
                        ## Зачем review
                        Чтобы в main попадал **понятный** код для всей команды.

                        ## Замечание в этом PR
                        Поля вроде `usr_nm` вместо `userName` — через полгода никто не вспомнит смысл.

                        ## Как отвечать
                        Предложите переименовать, не ругайте лично. В игре — кнопка ответа в Slack.
                        """,
                        "Прочитайте и нажмите «Понятно»"),
                explorerReviewReplies()
        );
    }

    private static InteractiveTask explorerObserveMetrics(ProjectProfile profile) {
        String ticket = "EXP-301";
        return new InteractiveTask(
                ticket,
                "Мониторинг: сервис «красный» на дашборде",
                "Grafana показывает проблему. Посмотрите график и опишите, что видите.",
                TaskType.BUG_FIX, ScenarioTag.EXPLORER_OBSERVE, 1,
                List.of(
                        new TaskObjective("obj-read-obs-" + ticket, ObjectiveType.READ_MESSAGE,
                                "Прочитать запрос в Slack", "igor",
                                ScenarioLibrary.obsMessageId(ticket), null),
                        new TaskObjective("obj-guide-grafana-" + ticket, ObjectiveType.GUIDED_STEP,
                                "Открыть Grafana и нажать «Посмотрел график»", null, "step-grafana", null),
                        new TaskObjective("obj-reply-obs-" + ticket, ObjectiveType.REPLY_MESSAGE,
                                "Ответить PM в Slack", "igor", null, "explorer-obs-ok"),
                        new TaskObjective("obj-jira-obs-" + ticket, ObjectiveType.CLOSE_JIRA,
                                "Закрыть " + ticket + " в JIRA")
                ),
                explorerBrief("Grafana для новичка.md",
                        """
                        ## Grafana — «приборная панель» сервисов
                        Графики показывают: ошибки, задержки, нагрузку. Красный = плохо.

                        ## Что делать
                        1. Откройте приложение Grafana на рабочем столе.
                        2. Нажмите кнопку «Посмотрел график» внизу окна.
                        3. Напишите PM простыми словами: «вижу рост ошибок с 10:00».

                        Код и kubectl в этом режиме не нужны.
                        """,
                        "Сначала Grafana, потом Slack"),
                List.of(
                        new ReplyOption("explorer-obs-ok",
                                "На графике рост ошибок с утра, похоже на деградацию сервиса",
                                true, "Игорь: «Спасибо, эскалирую дежурному»"),
                        new ReplyOption("explorer-obs-guess",
                                "Не знаю, выглядит нормально",
                                false, "Игорь: «Посмотри ещё раз на красную зону» (+стресс)")
                )
        );
    }
}
