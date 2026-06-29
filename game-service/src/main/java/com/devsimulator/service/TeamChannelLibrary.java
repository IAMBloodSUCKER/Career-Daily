package com.devsimulator.service;

import com.devsimulator.model.ChatMessage;
import com.devsimulator.model.GameBalance;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ProjectType;
import com.devsimulator.model.TeamMemberIntro;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/** Общие сообщения в Slack-канале команды — без @упоминания игрока. */
public final class TeamChannelLibrary {

    private TeamChannelLibrary() {
    }

    public static List<ChatMessage> bootstrapFeed(ProjectProfile profile, int day, GameMode mode) {
        Random rnd = new Random(day * 7919L + profile.type().ordinal() * 1337L + mode.ordinal());
        List<ChatMessage> out = new ArrayList<>();
        if (profile.team().isEmpty()) {
            return out;
        }

        long ts = System.currentTimeMillis() - 3_600_000L;
        String leadId = profile.team().get(0).id();
        int introStep = Math.min(1, profile.introSteps().size() - 1);

        out.add(ChatMessage.channelPost(
                "msg-ch-intro",
                leadId,
                "📌 Канал команды: " + profile.slackChannel() + ". "
                        + "Продукт: " + profile.productName() + ". "
                        + profile.introSteps().get(introStep),
                ts));
        ts += 55_000L;

        List<TeamMemberIntro> others = new ArrayList<>(profile.team().subList(1, profile.team().size()));
        Collections.shuffle(others, rnd);
        int greetCount = Math.min(others.size(), mode == GameMode.EXPLORER ? 1 : 2 + rnd.nextInt(2));
        for (int i = 0; i < greetCount; i++) {
            TeamMemberIntro member = others.get(i);
            out.add(ChatMessage.channelPost(
                    "msg-ch-greet-" + member.id() + "-d" + day,
                    member.id(),
                    member.greeting(),
                    ts));
            ts += 48_000L;
        }

        String facilitator = TeamGenerator.facilitatorId(profile);
        if (TeamGenerator.hasMember(profile, facilitator)) {
            out.add(ChatMessage.channelPost(
                    "msg-ch-standup-d" + day,
                    facilitator,
                    "⏰ Daily Standup в " + GameBalance.standupStartTimeLabel()
                            + " — коротко: вчера / сегодня / блокеры.",
                    ts));
            ts += 40_000L;
        }

        String flavor = projectFlavor(profile, day, rnd);
        if (flavor != null) {
            out.add(ChatMessage.channelPost(
                    "msg-ch-flavor-d" + day,
                    pickMember(profile, rnd).id(),
                    flavor,
                    ts));
            ts += 35_000L;
        }

        int banterCount = 1 + rnd.nextInt(2);
        List<String> banter = pickBanter(profile, day, rnd, banterCount);
        for (int i = 0; i < banter.size(); i++) {
            out.add(ChatMessage.channelPost(
                    "msg-ch-banter-d" + day + "-" + i,
                    pickMember(profile, rnd).id(),
                    banter.get(i),
                    ts));
            ts += 30_000L;
        }

        return out;
    }

    private static TeamMemberIntro pickMember(ProjectProfile profile, Random rnd) {
        return profile.team().get(rnd.nextInt(profile.team().size()));
    }

    private static String projectFlavor(ProjectProfile profile, int day, Random rnd) {
        return switch (profile.type()) {
            case EDTECH -> rnd.nextBoolean()
                    ? "📚 На staging залили новый модуль курса — QA гоняет на тестовых студентах."
                    : "📈 Completion rate вчера +2% — product смотрит отчёт в Grafana.";
            case E_COMMERCE -> "🛒 Пик checkout в 12:00–14:00 — мониторим payment-service.";
            case FINTECH -> "💳 Ночной релиз payment-core прошёл без инцидентов. Sonar зелёный.";
            case STARTUP -> "🚀 Демо инвесторам в пятницу — feature freeze с четверга.";
            case ENTERPRISE -> "📋 Change request CR-" + (1200 + day) + " согласован CAB — деплой в окно 02:00.";
            case MDM -> "🗂 Синхронизация справочников прошла — расхождений 0.";
            case SOCIAL_PLATFORM -> "💬 Лента на staging — проверяем лимиты rate limiter.";
            case OPEN_BANKING -> "🏦 API sandbox обновлён — партнёры тестируют OAuth.";
            case SUPPLY_CHAIN -> "📦 WMS-интеграция: очередь заказов без лагов.";
            case HEALTHCARE -> "🏥 HL7-коннектор на staging — compliance review в процессе.";
            case INSURTECH -> "📄 Полисы: nightly batch завершился в SLA.";
            case IOT_PLATFORM -> "📡 Telemetry ingest держит 12k msg/s на staging.";
            case LOGISTICS -> "🚚 Маршрутизация: A/B тест нового алгоритма с понедельника.";
            case GOVTECH -> "🏛 Релиз только через согласованное окно — см. календарь.";
            case MEDIA_STREAMING -> "🎬 CDN cache hit rate 94% — можно не трогать.";
        };
    }

    private static List<String> pickBanter(ProjectProfile profile, int day, Random rnd, int count) {
        List<String> pool = new ArrayList<>(GENERAL_BANTER);
        pool.addAll(banterForType(profile.type()));
        Collections.shuffle(pool, rnd);
        return pool.subList(0, Math.min(count, pool.size()));
    }

    private static List<String> banterForType(ProjectType type) {
        return switch (type) {
            case EDTECH -> List.of(
                    "Кто-нибудь видел, почему progress API на staging отдаёт 502?",
                    "Студенты на prod нашли опечатку в сертификате — тикет уже в JIRA.",
                    "Воскресенье вечером не планируйте релиз — пик дедлайнов курсов.",
                    "Elasticsearch reindex ночью — утром проверим поиск по курсам.");
            case FINTECH -> List.of(
                    "PCI audit через две недели — без секретов в логах, пожалуйста.",
                    "Нагрузочный тест payment-gateway в 18:00 — не деплоим в это окно.");
            case E_COMMERCE -> List.of(
                    "Корзина на staging — кто-то забыл включить feature flag?",
                    "Black Friday rehearsal в следующем спринте — закладываем capacity.");
            default -> List.of(
                    "Sprint board обновили — гляньте колонку In Review.",
                    "Кофе в кухне закончился ☕",
                    "Staging подняли после ночного деплоя — smoke tests зелёные.");
        };
    }

    private static final List<String> GENERAL_BANTER = List.of(
            "Кто брал последний стикер JIRA на стенде? 😄",
            "Напоминаю: MR без описания — в review не берём.",
            "Grafana dashboard «Daily Health» — добавил алерт на error rate.",
            "Кто-нибудь знает, куда делся тестовый пользователь staging?",
            "Retro в пятницу 16:00 — киньте темы в тред.",
            "Линтер в CI снова строгий — проверяйте перед push.",
            "All-hands в четверг — agenda в Confluence.",
            "Кто-нибудь видел, почему Jenkins queue длинная?",
            "Новый стажёр в соседней команде — поприветствуем в #general.",
            "Документация API обновлена — ссылка в pin.",
            "Кто-нибудь тестировал новый Slack workflow для деплоя?",
            "Парковка у БЦ сегодня забита — приезжайте раньше.",
            "Кондиционер на 3 этаже снова гудит — facility уже знает.",
            "Кто брал адаптер USB-C? Верните в переговорку 🙂",
            "Sprint goal на доске — синхронизируйте статусы до daily.",
            "Кто-нибудь видел алерт в #alerts-prod ночью? Ложный?",
            "Обновили Java dependency — прогоните regression на staging.",
            "Кто идёт на обед в 13:00? Соберёмся у лифта.",
            "Напоминание: секреты только в Vault, не в .env в репо.",
            "Кто-нибудь настроил новый дашборд в Kibana? Поделитесь.",
            "Планируем team building — опрос в треде.",
            "Кто-нибудь знает, когда починят принтер на 3 этаже?",
            "Code style guide обновили — гляньте diff в wiki.",
            "Кто-нибудь видел, почему Sonar ругается на coverage?",
            "Напоминание: PTO отмечайте в календаре заранее.",
            "Кто-нибудь тестировал новый endpoint на dev? Отзывы?",
            "Кто-нибудь видел, почему staging медленнее обычного?",
            "Напоминание: 1:1 с lead — слоты в календаре.",
            "Кто-нибудь знает, когда будет window для prod deploy?",
            "Кто-нибудь видел, почему Slack bot не отвечает?"
    );
}
