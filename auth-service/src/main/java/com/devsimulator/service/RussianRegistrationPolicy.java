package com.devsimulator.service;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/** Правила регистрации для РФ: телефон +7, без зарубежной почты как идентификатора. */
public final class RussianRegistrationPolicy {

    private static final Pattern PHONE_DIGITS = Pattern.compile("\\D");
    private static final Set<String> RUSSIAN_MAIL_DOMAINS = Set.of(
            "mail.ru", "inbox.ru", "bk.ru", "list.ru", "internet.ru",
            "yandex.ru", "ya.ru", "yandex.com", "narod.ru",
            "rambler.ru", "lenta.ru", "ro.ru", "autorambler.ru", "myrambler.ru",
            "sibmail.com", "pochta.ru", "e1.ru"
    );

    private static final Set<String> BLOCKED_FOREIGN_DOMAINS = Set.of(
            "gmail.com", "googlemail.com",
            "outlook.com", "hotmail.com", "live.com", "msn.com",
            "yahoo.com", "yahoo.co.uk", "ymail.com",
            "icloud.com", "me.com", "mac.com",
            "proton.me", "protonmail.com", "pm.me",
            "aol.com", "gmx.com", "gmx.de", "gmx.net",
            "mail.com", "zoho.com", "fastmail.com",
            "tutanota.com", "tuta.io"
    );

    private RussianRegistrationPolicy() {
    }

    public static String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Укажите номер телефона +7");
        }
        String digits = PHONE_DIGITS.matcher(raw.trim()).replaceAll("");
        if (digits.length() == 11 && digits.startsWith("8")) {
            digits = "7" + digits.substring(1);
        }
        if (digits.length() == 10) {
            digits = "7" + digits;
        }
        if (digits.length() != 11 || !digits.startsWith("7")) {
            throw new IllegalArgumentException("Некорректный номер. Формат: +7XXXXXXXXXX");
        }
        return "+" + digits;
    }

    public static String normalizeEmail(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    public static void requireRussianEmail(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        int at = email.lastIndexOf('@');
        if (at < 1 || at >= email.length() - 1) {
            throw new IllegalArgumentException("Некорректный email");
        }
        String domain = email.substring(at + 1).toLowerCase(Locale.ROOT);
        if (BLOCKED_FOREIGN_DOMAINS.contains(domain)) {
            throw new IllegalArgumentException(
                    "Регистрация через зарубежную почту (" + domain + ") недоступна. "
                            + "Используйте телефон +7 или почту .ru / Яндекс / Mail.ru");
        }
        if (RUSSIAN_MAIL_DOMAINS.contains(domain)) {
            return;
        }
        if (domain.endsWith(".ru") || domain.endsWith(".su") || domain.equals("xn--p1ai")) {
            return;
        }
        throw new IllegalArgumentException(
                "Допустима только российская почта (.ru, Яндекс, Mail.ru и т.п.) или регистрация только по телефону +7");
    }

    public static boolean looksLikePhone(String login) {
        if (login == null || login.isBlank()) {
            return false;
        }
        String trimmed = login.trim();
        if (trimmed.startsWith("+7") || trimmed.startsWith("8") || trimmed.startsWith("7")) {
            String digits = PHONE_DIGITS.matcher(trimmed).replaceAll("");
            return digits.length() >= 10 && digits.length() <= 11;
        }
        return false;
    }
}
