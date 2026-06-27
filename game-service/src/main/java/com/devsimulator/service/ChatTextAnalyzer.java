package com.devsimulator.service;

import java.util.Locale;
import java.util.regex.Pattern;

/** Простой анализ свободного текста в рабочих чатах — без ML. */
public final class ChatTextAnalyzer {

    public enum Kind {
        PROFANITY,
        RUDE,
        RESIGNATION,
        GREETING,
        THANKS,
        QUESTION,
        OFF_TOPIC,
        SMALL_TALK,
        GENERIC
    }

    private static final String[] PROFANITY_TOKENS = {
            "хуй", "хуя", "хуе", "хуи", "хуё", "хер", "пизд", "пizd", "ебал", "ебат", "ебан",
            "ебл", "ебу", "ёб", "бля", "бляд", "блят", "сука", "сук", "муда", "мудил",
            "говн", "gvn", "shit", "fuck", "fuk", "bitch", "asshole", "дерьм", "жоп",
            "залуп", "пидор", "пидар", "педик", "манд", "твар", "срать", "срал"
    };

    private static final String[] RUDE_TOKENS = {
            "кончен", "конч", "идиот", "дурак", "дебил", "тупой", "тупая", "тупое",
            "отстань", "отвали", "заткн", "закрой рот", "ненавиж", "ублюд", "мраз",
            "скотин", "урод", "чмо", "долбоеб", "долбаеб", "мудак", "кретин",
            "придурок", "мразь", "шлюх", "шалав", "даун", "козел", "козёл", "сволоч"
    };

    private static final Pattern PROFANITY = Pattern.compile(
            ".*("
                    + "х+[uуyи]*[iйj]+|"
                    + "п+[iи]*[zз3]+[dд]|"
                    + "б+[lл]*[yя9]+[dtт]*|"
                    + "e+[bб6]+[aа@]*[tт7]*|"
                    + "ё+[bб6]+|"
                    + "с+[uуy]+[kк4]+[aа@]|"
                    + "м+[uуy]+[dд]+[aа@][kк]|"
                    + "г+[aа@][nн][dд][oо0][nн]|"
                    + "f+u+c+k+|"
                    + "s+h+[i1!]+t+|"
                    + "b+[i1!]+tch|"
                    + "a+s+h+o+l+e"
                    + ").*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern RUDE = Pattern.compile(
            ".*(идиот|дурак|дебил|тупой|отстань|отвали|заткн|закрой\\s+рот|ненавиж|ублюд|мраз|"
                    + "кончен|кончена|конченый|конченая|ты\\s+.*(дура|идиот|дебил|туп)).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern RESIGNATION = Pattern.compile(
            ".*(увол|уволь|хочу\\s+уйти|уйти\\s+с\\s+работ|бросить\\s+работ|"
                    + "quit\\s+job|resign|уволиться|сваливаю|подаю\\s+заявлен).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern GREETING = Pattern.compile(
            ".*(привет|здравств|добрый|доброе|салют|хай|hi|hello|hey|йо|yo|прив\\p{L}*|privet|zdrav).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern THANKS = Pattern.compile(
            ".*(спасиб|благодар|thanks|thank you|thx|мерси).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern QUESTION = Pattern.compile(
            ".*(\\?|кто|что|где|когда|как|зачем|почему|можно ли|подскаж|help|how|what|why|where).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern OFF_TOPIC = Pattern.compile(
            ".*(погода|обед|кофе|устал|скучно|lol|хах|ахах|netflix|сериал|футбол).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern SMALL_TALK = Pattern.compile(
            ".*(рад быть|готов к работе|готов к|понял[,!]?\\s*спасибо|"
                    + "с чего начать|с чего старт|что делать|куда смотреть|посмотрю задач|ок[,!]?|понял|принял|услышал).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private ChatTextAnalyzer() {
    }

    public static Kind classify(String text) {
        if (text == null || text.isBlank()) {
            return Kind.GENERIC;
        }
        String lower = text.toLowerCase(Locale.ROOT).trim();
        String compact = normalize(lower);

        if (containsProfanity(lower) || containsProfanity(compact)) {
            return Kind.PROFANITY;
        }
        if (containsRude(lower) || containsRude(compact)) {
            return Kind.RUDE;
        }
        if (RESIGNATION.matcher(lower).matches()) {
            return Kind.RESIGNATION;
        }
        if (looksLikeGreeting(lower, compact)) {
            return Kind.GREETING;
        }
        if (THANKS.matcher(lower).matches()) {
            return Kind.THANKS;
        }
        if (QUESTION.matcher(lower).matches()) {
            return Kind.QUESTION;
        }
        if (OFF_TOPIC.matcher(lower).matches()) {
            return Kind.OFF_TOPIC;
        }
        if (SMALL_TALK.matcher(lower).matches()) {
            return Kind.SMALL_TALK;
        }
        return Kind.GENERIC;
    }

    public static boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        String compact = normalize(lower);
        if (PROFANITY.matcher(compact).matches() || PROFANITY.matcher(lower).matches()) {
            return true;
        }
        return containsAnyToken(compact, PROFANITY_TOKENS);
    }

    public static boolean containsRude(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        String compact = normalize(lower);
        if (RUDE.matcher(lower).matches()) {
            return true;
        }
        return containsAnyToken(compact, RUDE_TOKENS);
    }

    private static boolean containsAnyToken(String normalized, String[] tokens) {
        for (String token : tokens) {
            if (normalized.contains(token)) {
                return true;
            }
        }
        return false;
    }

    public static boolean looksLikeGreeting(String lower, String compact) {
        if (GREETING.matcher(lower).matches()) {
            return true;
        }
        if (compact.startsWith("priv") || compact.startsWith("прив")) {
            return true;
        }
        return levenshtein(compact, "привет") <= 2
                || levenshtein(compact, "privet") <= 2
                || levenshtein(compact, "hello") <= 2;
    }

    public static boolean looksLikeGreeting(String text) {
        if (text == null) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT).trim();
        return looksLikeGreeting(lower, normalize(lower));
    }

    private static String normalize(String raw) {
        String s = raw
                .replace('ё', 'е')
                .replace('@', 'a')
                .replace('0', 'o')
                .replace('1', 'i')
                .replace('3', 'e')
                .replace('4', 'a')
                .replace('5', 's')
                .replace('6', 'b')
                .replace('7', 't')
                .replace('$', 's');
        s = s.replaceAll("[^a-zа-я]", "");
        return s;
    }

    private static int levenshtein(String a, String b) {
        if (a.length() > 24) {
            a = a.substring(0, 24);
        }
        if (b.length() > 24) {
            b = b.substring(0, 24);
        }
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= b.length(); j++) {
            dp[0][j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }
}
