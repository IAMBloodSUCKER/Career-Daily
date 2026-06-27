package com.devsimulator.service;

import com.devsimulator.model.CodeChallenge;

import java.util.ArrayList;
import java.util.List;

public final class CodeValidator {

    private CodeValidator() {
    }

    public record ValidationResult(boolean passed, List<String> consoleLines, String summary) {
    }

    private static void appendTestFailure(List<String> lines, String testName, String className,
                                          String method, int line, String exception, String detail) {
        lines.add("Running " + testName + " ... FAILED");
        lines.add("");
        lines.add("[ERROR] " + testName);
        lines.add("  " + exception + ": " + detail);
        lines.add("      at " + className + "." + method + "(" + className + ".java:" + line + ")");
        lines.add("");
        lines.add("Tests run: 3, Failures: 1, Errors: 1");
        lines.add("BUILD FAILURE");
    }

    private static int findLineNumber(String code, String needle) {
        String[] rows = code.split("\n", -1);
        for (int i = 0; i < rows.length; i++) {
            if (rows[i].contains(needle)) {
                return i + 1;
            }
        }
        return 1;
    }

    public static ValidationResult runTests(String code, CodeChallenge challenge) {
        List<String> lines = new ArrayList<>();
        lines.add("$ mvn test -pl order-service");
        lines.add("");
        lines.add("Running com.devsimulator.OrderServiceTest...");

        if (challenge == null || challenge.requiredFragments().isEmpty()) {
            lines.add("Tests run: 1, Failures: 0");
            lines.add("BUILD SUCCESS");
            return new ValidationResult(true, lines, "Код просмотрен");
        }

        boolean isNpeTask = challenge.fileName().contains("OrderService") && code.contains("getEmail()");
        if (isNpeTask) {
            boolean hasNullCheck = containsAny(code, "if (customer == null)", "if (customer != null)",
                    "Objects.requireNonNull", "customer == null", "customer != null");
            boolean stillBroken = code.contains("customer.getEmail();")
                    && !code.contains("customer != null")
                    && !code.contains("customer == null");
            if (stillBroken || !hasNullCheck) {
                int line = findLineNumber(code, "customer.getEmail()");
                appendTestFailure(lines,
                        "OrderServiceTest.processPayment_nullCustomer",
                        "OrderService", "processPayment", line,
                        "java.lang.NullPointerException",
                        "Cannot invoke \"Customer.getEmail()\" because \"customer\" is null");
                return new ValidationResult(false, lines, "Тест упал с NullPointerException");
            }
        }

        boolean hasSync = containsAny(code, "synchronized", "AtomicInteger", "ReentrantLock");
        if ((challenge.fileName().contains("PaymentService")
                || challenge.fileName().contains("WalletService")
                || challenge.fileName().contains("InventoryService")) && !hasSync) {
            int line = findLineNumber(code, "balance");
            if (line == 1) {
                line = findLineNumber(code, "counter");
            }
            appendTestFailure(lines,
                    "RaceConditionTest.testConcurrentUpdates",
                    challenge.fileName().replace(".java", ""), "process", line,
                    "java.lang.AssertionError",
                    "expected 1000 but was 847");
            return new ValidationResult(false, lines, "Race condition не исправлен");
        }

        if (challenge.fileName().contains("CacheService")) {
            boolean stillLeaking = code.contains("private static final List")
                    || code.contains("static final List");
            if (stillLeaking && !containsAny(code, "Caffeine", "maxSize", "LRU", "CACHE.clear()")) {
                int line = findLineNumber(code, "CACHE");
                appendTestFailure(lines,
                        "MemoryLeakTest.heapGrowthUnderLoad",
                        challenge.fileName().replace(".java", ""), "get", line,
                        "java.lang.OutOfMemoryError",
                        "heap growth 512Mi → 1.8Gi in 10 min");
                return new ValidationResult(false, lines, "Утечка памяти не исправлена");
            }
        }

        if (challenge.fileName().contains("Consumer")) {
            boolean noRetry = !containsAny(code, "@Retryable", "RetryTemplate", "deadLetter", "nack", "try {");
            if (noRetry && code.contains("paymentGatewayClient.charge")) {
                int line = findLineNumber(code, "paymentGatewayClient.charge");
                appendTestFailure(lines,
                        "IntegrationTest.consumerStallsOn504",
                        "OrderEventConsumer", "onMessage", line,
                        "org.springframework.web.client.HttpServerErrorException",
                        "simulated 504 caused consumer stall");
                return new ValidationResult(false, lines, "Нет retry/DLQ для внешней интеграции");
            }
        }

        if (challenge.fileName().contains("OrderService") && code.contains("@Transactional")) {
            lines.add("Analysis: @Transactional on private method — proxy bypass");
            lines.add("Review: self-invocation breaks transaction boundary");
            lines.add("BUILD SUCCESS (review mode)");
            return new ValidationResult(true, lines, "Код изучен — проблема @Transactional найдена");
        }

        ValidationResult fragmentCheck = validateRequiredFragments(code, challenge, lines);
        if (fragmentCheck != null) {
            return fragmentCheck;
        }

        lines.add("Tests run: 3, Failures: 0, Errors: 0");
        lines.add("BUILD SUCCESS");
        return new ValidationResult(true, lines, "Все тесты прошли");
    }

    public static ValidationResult submitFix(String code, CodeChallenge challenge) {
        if (challenge == null) {
            return new ValidationResult(true, List.of("Review submitted"), "Готово");
        }

        List<String> lines = new ArrayList<>();
        lines.add("$ git diff --stat");
        lines.add(" " + challenge.fileName() + " | 4 +++--");
        lines.add("$ mvn verify");

        for (String forbidden : challenge.forbiddenFragments()) {
            if (code.contains(forbidden.trim())) {
                lines.add("FAIL: проблемный код всё ещё на месте");
                return new ValidationResult(false, lines, "Фикс не принят — баг остался");
            }
        }

        boolean hasRequired = challenge.requiredFragments().isEmpty()
                || challenge.requiredFragments().stream().anyMatch(code::contains);

        if (!hasRequired) {
            lines.add("FAIL: ожидалось исправление согласно подсказке");
            return new ValidationResult(false, lines, "Код не прошёл проверку");
        }

        ValidationResult testResult = runTests(code, challenge);
        lines.addAll(testResult.consoleLines());
        if (!testResult.passed()) {
            return new ValidationResult(false, lines, testResult.summary());
        }

        lines.add("");
        lines.add("✓ SonarQube: 0 blocker issues");
        lines.add("✓ Ready to merge");
        return new ValidationResult(true, lines, "Фикс принят!");
    }

    public static ValidationResult reviewCode(String code) {
        List<String> lines = List.of(
                "Diff loaded: PaymentGateway.java",
                "Method charge(): 82 lines, complexity 14",
                "No tests added in this PR"
        );
        return new ValidationResult(true, lines, "Код изучен. Напишите Алексею результат ревью.");
    }

    private static ValidationResult validateRequiredFragments(String code, CodeChallenge challenge,
                                                             List<String> lines) {
        if (challenge.requiredFragments().isEmpty()) {
            return null;
        }
        boolean hasRequired = challenge.requiredFragments().stream().anyMatch(code::contains);
        if (!hasRequired) {
            lines.add("FAIL: ожидалось исправление согласно подсказке");
            lines.add("BUILD FAILURE");
            return new ValidationResult(false, lines, "Код не прошёл проверку");
        }
        for (String forbidden : challenge.forbiddenFragments()) {
            if (code.contains(forbidden.trim())) {
                lines.add("FAIL: проблемный код всё ещё на месте");
                lines.add("BUILD FAILURE");
                return new ValidationResult(false, lines, "Фикс не принят — баг остался");
            }
        }
        return null;
    }

    private static boolean containsAny(String code, String... fragments) {
        for (String f : fragments) {
            if (code.contains(f)) {
                return true;
            }
        }
        return false;
    }
}
