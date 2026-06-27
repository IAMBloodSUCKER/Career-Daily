package com.devsimulator.service;

import com.devsimulator.api.dto.MeetingDto;
import com.devsimulator.model.CareerTier;
import com.devsimulator.model.EmailMessage;
import com.devsimulator.model.ChatMessage;
import com.devsimulator.model.Contact;
import com.devsimulator.model.DayRecord;
import com.devsimulator.model.GameBalance;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.ObjectiveType;
import com.devsimulator.model.Player;
import com.devsimulator.model.ReplyOption;
import com.devsimulator.model.RestAction;
import com.devsimulator.model.ScenarioTag;
import com.devsimulator.model.TaskObjective;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ProjectType;
import com.devsimulator.model.TaskType;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot.DayRecordSnapshot;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot.EmailSnapshot;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot.MessageSnapshot;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot.ObjectiveSnapshot;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot.PlayerSnapshot;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot.TaskSnapshot;

import com.devsimulator.persistence.snapshot.GameEngineSnapshot.TeamMemberSnapshot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

public class InteractiveGameEngine {

    private static final int WORK_DAY_HOURS = GameBalance.WORK_DAY_HOURS;
    private static final int DAY_START_HOUR = GameBalance.DAY_START_HOUR;
    private static final int DAY_END_HOUR = GameBalance.DAY_END_HOUR;
    private static final String DEFAULT_REVIEWER = "alex";
    private static final Map<String, Integer> PR_NUMBERS = Map.of(
            "JIRA-142", 246,
            "INC-501", 251,
            "JIRA-201", 249,
            "INC-502", 252,
            "KAFKA-101", 253
    );

    private final Player player;
    private final GameMode mode;
    private final ProjectProfile projectProfile;
    private final DayRecord dayRecord = new DayRecord();

    private List<InteractiveTask> dailyTasks = new ArrayList<>();
    private List<ChatMessage> messages = new ArrayList<>();
    private List<EmailMessage> emails = new ArrayList<>();
    private final Map<String, String> editorCode = new HashMap<>();
    private List<String> consoleOutput = new ArrayList<>();

    private String focusedTaskId;
    private String lastMessage = "09:00. Вы за рабочим столом. Кликайте по приложениям на экране.";
    private boolean gameOver;
    private String gameOverReason;
    private int hoursRemaining = WORK_DAY_HOURS;
    private int currentHour = DAY_START_HOUR;
    private int currentMinute;
    private long dayStartedAtMillis;
    private boolean dayEnded;
    private boolean atDesk;
    private int lateMinutes;
    private MeetingDto pendingMeeting;
    private MeetingDto queuedMeeting;
    private MeetingDto scheduledDailyStandup;
    private boolean meetingMissedToday;
    private boolean sprintSyncAttendedToday;
    private int wallpaperIndex;
    private String pendingWorkloadContactId;
    private long lastBonusInjectionMs;
    private int bonusTasksInjectedToday;
    private long workIdleSinceMs;
    private long lastEventTickMs;

    public int getWallpaperIndex() {
        return wallpaperIndex;
    }

    public void setWallpaperIndex(int wallpaperIndex) {
        this.wallpaperIndex = Math.floorMod(wallpaperIndex, 10);
    }

    public MeetingDto getPendingMeeting() {
        syncStandupSchedule();
        return pendingMeeting;
    }

    public MeetingDto getScheduledDailyStandup() {
        return scheduledDailyStandup;
    }

    public boolean isMeetingMissedToday() {
        return meetingMissedToday;
    }

    public String getPendingWorkloadContactId() {
        return pendingWorkloadContactId;
    }

    public InteractiveGameEngine(Player player, GameMode mode, ProjectType projectType) {
        this(player, mode, projectType, null, false);
    }

    public InteractiveGameEngine(Player player, GameMode mode, ProjectType projectType,
                               List<com.devsimulator.model.TeamMemberIntro> teamOverride) {
        this(player, mode, projectType, teamOverride, false);
    }

    private InteractiveGameEngine(Player player, GameMode mode, ProjectType projectType,
                                  List<com.devsimulator.model.TeamMemberIntro> teamOverride, boolean deferInit) {
        this.player = player;
        this.mode = mode;
        ProjectProfile base = ProjectCatalog.get(projectType);
        List<com.devsimulator.model.TeamMemberIntro> team = teamOverride != null && !teamOverride.isEmpty()
                ? teamOverride
                : TeamGenerator.randomizeTeam(base, new Random());
        this.projectProfile = TeamGenerator.withTeam(base, team);
        this.atDesk = false;
        if (!deferInit) {
            startNewDayTasks();
        }
    }

    public boolean isAtDesk() {
        return atDesk;
    }

    public int getLateMinutes() {
        return lateMinutes;
    }

    public ProjectProfile getProjectProfile() {
        return projectProfile;
    }

    private void startNewDayTasks() {
        dailyTasks = new ArrayList<>(ScenarioLibrary.createDailyTasks(
                mode, player.getDay(), projectProfile, player.getExperienceYears()));
        if (player.getDay() == 1) {
            messages = new ArrayList<>(ScenarioLibrary.initialMessages(
                    dailyTasks, projectProfile, player.getName(), true,
                    player.getExperienceYears(), mode, player.getDay()));
        } else {
            messages = new ArrayList<>(ScenarioLibrary.initialMessages(
                    dailyTasks, projectProfile, player.getName(), false,
                    player.getExperienceYears(), mode, player.getDay()));
        }
        editorCode.clear();
        for (InteractiveTask task : dailyTasks) {
            if (task.getCodeChallenge() != null) {
                editorCode.put(task.getId(), task.getCodeChallenge().starterCode());
            }
        }
        consoleOutput = List.of("IntelliJ IDEA — ожидание запуска…");
        refreshEmails();
    }

    private void refreshEmails() {
        emails = new ArrayList<>(EmailLibrary.createInbox(
                dailyTasks, projectProfile, player.getName(), player.getDay()));
    }

    public List<EmailMessage> getEmails() {
        return emails;
    }

    public void tickDayEvents() {
        syncDayClockFromRealTime();
        syncStandupSchedule();
        long now = System.currentTimeMillis();
        if (now - lastEventTickMs < 5000) {
            return;
        }
        lastEventTickMs = now;
        if (!atDesk || dayEnded || gameOver || dayStartedAtMillis <= 0) {
            return;
        }
        if (getRealTimeRemainingMs() < 5 * 60_000L) {
            return;
        }

        CareerTier tier = CareerTier.fromExperience(player.getExperienceYears());
        int openWork = countOpenWorkTasks();

        if (openWork == 0) {
            if (workIdleSinceMs == 0) {
                workIdleSinceMs = now;
            } else {
                long workloadDelay = mode.isNoCode() ? 120_000L : tier.idleWorkloadCheckDelayMs();
                if (pendingWorkloadContactId == null && now - workIdleSinceMs >= workloadDelay) {
                    sendWorkloadCheck(now);
                }
            }
        } else {
            workIdleSinceMs = 0;
        }

        int maxBonus = mode.isNoCode() ? maxExplorerBonusTasksPerDay() : tier.maxBonusTasksPerDay();
        if (bonusTasksInjectedToday >= maxBonus || pendingWorkloadContactId != null) {
            return;
        }

        if (mode.isNoCode()) {
            return;
        }

        long sinceLast = lastBonusInjectionMs == 0
                ? now - dayStartedAtMillis
                : now - lastBonusInjectionMs;
        if (sinceLast < tier.bonusTaskIntervalMs()) {
            return;
        }

        boolean inject = openWork > 0 && new Random(now ^ player.getDay()).nextInt(100) < 35;
        if (inject) {
            injectBonusTask(now, "📋 Новая задача в JIRA");
        }
    }

    private int countOpenWorkTasks() {
        return (int) dailyTasks.stream()
                .filter(t -> !t.isCompleted())
                .filter(t -> t.getScenarioTag() != ScenarioTag.DAILY_STANDUP)
                .filter(t -> t.getType() != TaskType.MEETING)
                .count();
    }

    private void sendWorkloadCheck(long now) {
        var lead = projectProfile.team().get(0);
        pendingWorkloadContactId = lead.id();
        String at = ScenarioLibrary.mention(player.getName());
        messages.add(new ChatMessage(
                "msg-workload-" + now,
                lead.id(),
                lead.name() + ": «" + at + " Как по загрузке? Есть задачи в работе?»",
                false,
                null));
        lastMessage = lead.name() + " спрашивает про загрузку — ответьте в Slack";
    }

    private boolean injectBonusTask(long now, String logPrefix) {
        Set<String> usedTickets = dailyTasks.stream()
                .map(InteractiveTask::getTicketId)
                .collect(Collectors.toSet());
        Random rnd = new Random(player.getDay() * 7919L + now + bonusTasksInjectedToday);
        InteractiveTask task = mode.isNoCode()
                ? TaskPool.randomExplorerBonusTask(projectProfile, player.getDay(), rnd, usedTickets)
                : TaskPool.randomBonusTask(
                projectProfile, mode, player.getDay(), player.getExperienceYears(), rnd, usedTickets);
        if (task == null) {
            return false;
        }
        dailyTasks.add(task);
        if (task.getCodeChallenge() != null) {
            editorCode.put(task.getId(), task.getCodeChallenge().starterCode());
        }
        messages.addAll(ScenarioLibrary.announceTasks(
                List.of(task), projectProfile, player.getName(), player.getExperienceYears()));
        refreshEmails();
        lastBonusInjectionMs = now;
        bonusTasksInjectedToday++;
        workIdleSinceMs = 0;
        lastMessage = logPrefix + ": " + task.getTicketId();
        return true;
    }

    private ActionResult handleWorkloadReply(String contactId, String replyOptionId, String playerText) {
        if (pendingWorkloadContactId == null || !pendingWorkloadContactId.equals(contactId)) {
            return null;
        }

        String text = playerText != null ? playerText.trim() : "";
        if ("workload-yes".equals(replyOptionId)) {
            text = "Да, ещё есть в работе";
        } else if ("workload-no".equals(replyOptionId)) {
            text = "Нет, всё закрыл — можно ещё";
        } else if (replyOptionId != null) {
            ReplyOption option = findReplyOption(replyOptionId);
            if (option != null) {
                text = option.text();
            }
        }
        if (text.isBlank()) {
            return ActionResult.fail("Пустое сообщение");
        }

        messages.add(new ChatMessage("msg-player-" + System.nanoTime(), contactId, text, true, null));
        pendingWorkloadContactId = null;

        boolean needsWork = "workload-no".equals(replyOptionId)
                || text.toLowerCase().matches(".*(нет|свобод|закончил|простаив|нечего|пусто|готов взять).*");

        String npcReply;
        if (needsWork) {
            boolean injected = injectBonusTask(System.currentTimeMillis(), "Team Lead выдал задачу");
            npcReply = injected
                    ? projectProfile.team().get(0).name()
                    + ": «Ок, закинул в JIRA — глянь Slack, там детали.»"
                    : projectProfile.team().get(0).name()
                    + ": «Сейчас всё разобрали, но завтра накидаем. Можешь почитать доку.»";
        } else {
            npcReply = projectProfile.team().get(0).name()
                    + ": «Отлично. Если застрянешь — пиши.»";
            workIdleSinceMs = System.currentTimeMillis();
        }

        messages.add(new ChatMessage("msg-workload-reply-" + System.nanoTime(), contactId, npcReply, false, null));
        lastMessage = npcReply;
        return ActionResult.ok(lastMessage);
    }

    private static int maxExplorerBonusTasksPerDay() {
        return 3;
    }

    private ActionResult handleExplorerWorkRequest(String contactId, String replyOptionId, String playerText) {
        if (!mode.isNoCode()) {
            return null;
        }
        String leadId = projectProfile.team().get(0).id();
        if (!leadId.equals(contactId)) {
            return null;
        }
        if (countOpenWorkTasks() > 0) {
            return ActionResult.fail("Сначала закройте текущие задачи в JIRA");
        }
        if (bonusTasksInjectedToday >= maxExplorerBonusTasksPerDay()) {
            return ActionResult.fail("На сегодня дополнительных задач больше нет — можно завершить день");
        }

        String text = playerText != null ? playerText.trim() : "";
        if ("explorer-ask-work".equals(replyOptionId)) {
            text = "Готов взять ещё задачу";
        } else if ("explorer-ask-work-alt".equals(replyOptionId)) {
            text = "Чем заняться дальше?";
        }
        if (text.isBlank()) {
            return ActionResult.fail("Пустое сообщение");
        }

        messages.add(new ChatMessage("msg-player-" + System.nanoTime(), contactId, text, true, null));

        var lead = projectProfile.team().get(0);
        boolean injected = injectBonusTask(System.currentTimeMillis(), lead.name() + " выдал задачу");
        String npcReply = injected
                ? lead.name() + ": «Ок! Закинула в JIRA — смотри Slack и чеклист слева.»"
                : lead.name() + ": «На сегодня всё разобрали. Можешь отдохнуть или завершить день.»";

        messages.add(new ChatMessage("msg-explorer-work-" + System.nanoTime(), contactId,
                formatNpcFeedback(npcReply, contactId), false, null));
        lastMessage = npcReply;
        return ActionResult.ok(lastMessage);
    }

    private static boolean isAskingForWork(String lower) {
        return lower.matches(".*(дай задач|ещё задач|есть задач|чем занят|готов взять|можно задач|"
                + "нужна задач|что делать дальше|нет задач|свободен|нечего делать|можно ещё).*");
    }

    private ActionResult requireAtDesk() {
        if (!atDesk) {
            return ActionResult.fail("Сначала подойдите к рабочему месту");
        }
        if (gameOver) {
            return ActionResult.fail(gameOverReason);
        }
        tickDayEvents();
        if (dayEnded) {
            return ActionResult.fail("Рабочий день окончен. Нажмите «Закончить день» справа.");
        }
        return null;
    }

    private void startDayClock() {
        dayStartedAtMillis = System.currentTimeMillis();
        currentHour = DAY_START_HOUR;
        currentMinute = 0;
        hoursRemaining = WORK_DAY_HOURS;
        dayEnded = false;
    }

    private void ensureDayClockAnchored() {
        if (!atDesk || dayStartedAtMillis > 0) {
            return;
        }
        int minutesIntoDay = Math.max(0, (currentHour - DAY_START_HOUR) * 60 + currentMinute);
        long elapsed = minutesIntoDay * GameBalance.REAL_DAY_DURATION_MS / (WORK_DAY_HOURS * 60L);
        dayStartedAtMillis = System.currentTimeMillis() - elapsed;
    }

    private void syncDayClockFromRealTime() {
        if (!atDesk) {
            return;
        }
        ensureDayClockAnchored();
        if (dayStartedAtMillis <= 0) {
            return;
        }
        long elapsed = System.currentTimeMillis() - dayStartedAtMillis;
        long duration = GameBalance.REAL_DAY_DURATION_MS;
        if (elapsed >= duration) {
            hoursRemaining = 0;
            currentHour = DAY_END_HOUR;
            currentMinute = 0;
            dayEnded = true;
            return;
        }
        double progress = (double) elapsed / duration;
        int totalInGameMinutes = (int) (progress * WORK_DAY_HOURS * 60);
        currentHour = DAY_START_HOUR + totalInGameMinutes / 60;
        currentMinute = totalInGameMinutes % 60;
        long msLeft = duration - elapsed;
        hoursRemaining = Math.max(1, (int) Math.ceil(msLeft / (duration / (double) WORK_DAY_HOURS)));
        dayEnded = false;
        syncStandupSchedule();
    }

    private void syncStandupSchedule() {
        if (!atDesk || dayEnded || gameOver) {
            return;
        }
        int now = currentHour * 60 + currentMinute;
        int start = GameBalance.standupStartMinutes();
        int end = GameBalance.standupEndMinutes();

        if (meetingMissedToday && now < end && !isStandupObjectiveCompleted()) {
            meetingMissedToday = false;
            if (pendingMeeting == null && scheduledDailyStandup == null) {
                scheduledDailyStandup = MeetingLibrary.dailyStandup(player, projectProfile, dailyTasks, false);
            }
        }

        if (meetingMissedToday) {
            return;
        }

        if (scheduledDailyStandup != null && now >= start && pendingMeeting == null) {
            pendingMeeting = scheduledDailyStandup;
            scheduledDailyStandup = null;
        }

        if (pendingMeeting != null
                && pendingMeeting.id() != null
                && pendingMeeting.id().startsWith("daily-standup")
                && now >= end
                && !isStandupObjectiveCompleted()) {
            meetingMissedToday = true;
            pendingMeeting = null;
            failStandupObjective();
            lastMessage = "Daily Standup пропущен — вы не присоединились вовремя";
        }
    }

    private boolean isStandupObjectiveCompleted() {
        return dailyTasks.stream()
                .filter(t -> t.getTicketId() != null && t.getTicketId().startsWith("MEET-"))
                .flatMap(t -> t.getObjectives().stream())
                .anyMatch(o -> o.getType() == ObjectiveType.ATTEND_MEETING && o.isCompleted());
    }

    public long getDayStartedAtMillis() {
        syncDayClockFromRealTime();
        return dayStartedAtMillis;
    }

    public long getRealTimeRemainingMs() {
        syncDayClockFromRealTime();
        if (!atDesk || dayStartedAtMillis <= 0) {
            return GameBalance.REAL_DAY_DURATION_MS;
        }
        return Math.max(0, GameBalance.REAL_DAY_DURATION_MS - (System.currentTimeMillis() - dayStartedAtMillis));
    }

    public MeetingDto getQueuedMeeting() {
        return queuedMeeting;
    }

    public boolean isSprintSyncAttendedToday() {
        return sprintSyncAttendedToday;
    }

    public int getCurrentHour() {
        syncDayClockFromRealTime();
        return currentHour;
    }

    public int getCurrentMinute() {
        syncDayClockFromRealTime();
        return currentMinute;
    }

    public ActionResult arriveAtDesk(String arrivalType, List<String> roomActions) {
        if (atDesk) {
            return ActionResult.fail("Вы уже за рабочим столом");
        }
        if (gameOver) {
            return ActionResult.fail(gameOverReason);
        }

        String type = arrivalType != null ? arrivalType.toUpperCase() : "ON_TIME";
        atDesk = true;
        lateMinutes = 0;

        applyRoomActions(roomActions);

        switch (type) {
            case "LATE" -> applyLateArrival(60, 1, 15, 2, 1,
                    String.format("10:00. Вы опоздали на работу. Daily в %s — успейте подключиться.",
                            GameBalance.standupStartTimeLabel()),
                    "Опоздание на работу");
            case "OVERSLEPT" -> applyLateArrival(120, 2, 30, 3, 2,
                    GameBalance.standupStartTimeLabel() + ". Вы проснулись слишком поздно. Team Lead в ярости.",
                    "Грубое опоздание — проспали до " + GameBalance.standupStartTimeLabel());
            case "ON_TIME" -> {
                startDayClock();
                lastMessage = String.format("%02d:00. Вы за рабочим столом. Slack уже мигает.",
                        currentHour);
            }
            default -> {
                startDayClock();
                lastMessage = String.format("%02d:00. Вы за рабочим столом.", currentHour);
            }
        }

        scheduleStandupForToday(type);

        checkGameState();
        return ActionResult.ok(lastMessage);
    }

    private void scheduleStandupForToday(String arrivalType) {
        int now = currentHour * 60 + currentMinute;
        int start = GameBalance.standupStartMinutes();
        int end = GameBalance.standupEndMinutes();

        if (now >= end) {
            meetingMissedToday = true;
            pendingMeeting = null;
            scheduledDailyStandup = null;
            failStandupObjective();
            if (!"ON_TIME".equals(arrivalType)) {
                addLateArrivalSms();
            }
            return;
        }

        meetingMissedToday = false;
        scheduledDailyStandup = MeetingLibrary.dailyStandup(player, projectProfile, dailyTasks, false);
        pendingMeeting = null;

        if (now >= start) {
            pendingMeeting = scheduledDailyStandup;
            scheduledDailyStandup = null;
        }

        if (mode == GameMode.REALISTIC || mode == GameMode.CHALLENGE) {
            queuedMeeting = MeetingLibrary.sprintSync(player, projectProfile, dailyTasks);
        }

        if (!"ON_TIME".equals(arrivalType) && now >= start) {
            addLateArrivalSms();
        }
    }

    private void addLateArrivalSms() {
        String leadName = projectProfile.team().get(0).name();
        String sms = ScenarioLibrary.mention(player.getName())
                + " Ты где? Мы уже на daily. Ответь в Slack, как будешь на месте.";
        messages.add(0, new ChatMessage(
                "msg-late-sms-" + System.nanoTime(), "anna", sms, false, null));
    }

    public ActionResult leaveDesk() {
        if (!atDesk) {
            return ActionResult.fail("Вы не за рабочим столом");
        }
        if (gameOver) {
            return ActionResult.fail(gameOverReason);
        }
        atDesk = false;
        lastMessage = "Вы отошли от стола. Можно прогуляться по офису.";
        return ActionResult.ok(lastMessage);
    }

    private void applyRoomActions(List<String> roomActions) {
        if (roomActions == null || roomActions.isEmpty()) {
            return;
        }
        for (String action : roomActions) {
            if (action == null) continue;
            switch (action) {
                case "coffee" -> player.addEnergy(8);
                case "greet" -> player.addSoftSkills(2);
                case "kitchen_chat" -> {
                    player.addStress(5);
                    player.addColleagueRating(-1);
                }
                case "slack_lie" -> player.addColleagueRating(-2);
                case "slow" -> player.addStress(3);
                default -> { /* flavor only */ }
            }
        }
    }

    public ActionResult completeMeeting(String meetingId, String responseId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        if (pendingMeeting == null || !pendingMeeting.id().equals(meetingId)) {
            return ActionResult.fail("Митинг недоступен");
        }

        if (responseId != null) {
            applyMeetingResponse(responseId);
        }

        completeStandupObjective();
        advanceTime(1);
        player.addSoftSkills(1);
        player.addColleagueRating(1);

        lastMessage = "📹 Митинг завершён";
        if (meetingId.startsWith("sprint-sync")) {
            sprintSyncAttendedToday = true;
        }
        pendingMeeting = null;

        if (queuedMeeting != null) {
            MeetingDto next = queuedMeeting;
            queuedMeeting = null;
            pendingMeeting = next;
            lastMessage += ". Следующий: Sprint Sync — присоединяйтесь.";
        }

        checkGameState();
        return ActionResult.ok(lastMessage);
    }

    private void applyMeetingResponse(String responseId) {
        if (responseId.contains("blocked") || responseId.contains("late")) {
            player.addStress(8);
            player.addColleagueRating(-1);
            lastMessage = "Team Lead недоволен ответом на daily (+стресс)";
        }
    }

    private void completeStandupObjective() {
        for (InteractiveTask task : dailyTasks) {
            if (task.getTicketId().startsWith("MEET-")) {
                for (TaskObjective obj : task.getObjectives()) {
                    if (obj.getType() == ObjectiveType.ATTEND_MEETING && !obj.isCompleted()) {
                        obj.complete();
                    }
                }
                tryCompleteTask(task);
            }
        }
    }

    private void failStandupObjective() {
        player.addColleagueRating(-1);
        player.addStress(10);
    }

    private void applyLateArrival(int minutesLate, int hoursLost, int stress, int ratingLoss,
                                  int warningCount, String message, String warningReason) {
        lateMinutes = minutesLate;
        startDayClock();
        long offset = (long) hoursLost * GameBalance.REAL_DAY_DURATION_MS / WORK_DAY_HOURS;
        dayStartedAtMillis = System.currentTimeMillis() - offset;
        syncDayClockFromRealTime();
        player.addStress(stress);
        player.addColleagueRating(-ratingLoss);
        int effectiveWarnings = warningCount;
        if (mode.isSoftHr() && player.getDay() < GameBalance.MIN_DAY_BEFORE_TERMINATION) {
            effectiveWarnings = 0;
        }
        int issued = 0;
        for (int i = 0; i < effectiveWarnings; i++) {
            if (addWarningIfAllowed(warningReason)) {
                issued++;
            }
        }
        lastMessage = message + (issued > 0
                ? " (⚠ предупреждение" + (issued > 1 ? " x" + issued : "") + ")"
                : mode.isSoftHr() ? " (испытательный срок — без предупреждения)" : "");
    }

    public ActionResult respondToLateSms(String replyType) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        String type = replyType != null ? replyType.toUpperCase() : "APOLOGY";
        String npcReply;
        if ("EXCUSE".equals(type)) {
            npcReply = projectProfile.team().get(0).name()
                    + ": «Ладно, но сегодня закрой хотя бы одну задачу до обеда.»";
        } else if ("LIE".equals(type)) {
            player.addColleagueRating(-1);
            if (!(mode.isSoftHr() && player.getDay() < GameBalance.MIN_DAY_BEFORE_TERMINATION)) {
                addWarningIfAllowed("Ложь Team Lead в SMS — в Slack видно offline");
            }
            npcReply = projectProfile.team().get(0).name()
                    + ": «В Slack видно, что ты offline. Не ври.» (+предупреждение)";
        } else {
            npcReply = projectProfile.team().get(0).name()
                    + ": «Ок, жду. JIRA не ждёт.»";
        }
        messages.add(new ChatMessage("msg-late-reply-" + System.nanoTime(), "anna", npcReply, false, null));
        lastMessage = npcReply;
        checkGameState();
        return ActionResult.ok(lastMessage);
    }

    public Player getPlayer() {
        return player;
    }

    public GameMode getMode() {
        return mode;
    }

    public boolean isNoCodeMode() {
        return mode.isNoCode();
    }

    public List<InteractiveTask> getDailyTasks() {
        return dailyTasks.stream().filter(t -> !t.isCompleted()).toList();
    }

    public List<InteractiveTask> getAllTasks() {
        return dailyTasks;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public List<Contact> getContacts() {
        return ScenarioLibrary.contactsFrom(projectProfile);
    }

    public String getFocusedTaskId() {
        return focusedTaskId;
    }

    public String getEditorCode(String taskId) {
        return editorCode.getOrDefault(taskId,
                dailyTasks.stream()
                        .filter(t -> t.getId().equals(taskId))
                        .findFirst()
                        .map(t -> t.getCodeChallenge() != null ? t.getCodeChallenge().starterCode() : "")
                        .orElse(""));
    }

    public void setEditorCode(String taskId, String code) {
        editorCode.put(taskId, code);
    }

    public List<String> getConsoleOutput() {
        return consoleOutput;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public String getGameOverReason() {
        return gameOverReason;
    }

    public int getHoursRemaining() {
        syncDayClockFromRealTime();
        return hoursRemaining;
    }

    public String getTimeLabel() {
        syncDayClockFromRealTime();
        return String.format("%02d:%02d", currentHour, currentMinute);
    }

    public boolean isDayEnded() {
        syncDayClockFromRealTime();
        return dayEnded;
    }

    public DayRecord getDayRecord() {
        return dayRecord;
    }

    public ActionResult focusTask(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null || task.isCompleted()) {
            return ActionResult.fail("Задача недоступна");
        }
        focusedTaskId = taskId;
        task.setJiraStatus("IN PROGRESS");
        if (mode.isNoCode()) {
            completeObjective(task, ObjectiveType.GUIDED_STEP, "step-jira-open");
        }
        lastMessage = mode.isNoCode()
                ? "📋 " + task.getTicketId() + " — откройте краткое описание в IntelliJ или ответьте в Slack"
                : "📋 " + task.getTicketId() + " взята в работу — откройте IntelliJ или Slack";
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage);
    }

    public ActionResult completeGuidedStep(String taskId, String stepId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        if (!mode.isNoCode()) {
            return ActionResult.fail("Краткое описание задачи доступно только в режиме «Знакомство»");
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        boolean matched = false;
        for (TaskObjective obj : task.getObjectives()) {
            if (obj.isCompleted() || obj.getType() != ObjectiveType.GUIDED_STEP) {
                continue;
            }
            if (stepId != null && stepId.equals(obj.getMessageId())) {
                obj.complete();
                matched = true;
                advanceTime(1);
                lastMessage = "✓ " + obj.getLabel();
                break;
            }
        }
        if (!matched) {
            return ActionResult.fail("Шаг не найден или уже выполнен");
        }
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage);
    }

    private ActionResult noCodeBlocked() {
        if (mode.isNoCode()) {
            return ActionResult.fail(
                    "В режиме «Знакомство» код не нужен — следуйте чеклисту: Slack, JIRA, краткое описание, ответ.");
        }
        return null;
    }

    public ActionResult readContactMessages(String contactId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        if (contactId == null || contactId.isBlank()) {
            return ActionResult.fail("Контакт не указан");
        }
        int readCount = 0;
        for (ChatMessage msg : messages) {
            if (!contactId.equals(msg.getContactId()) || msg.isFromPlayer() || msg.isRead()) {
                continue;
            }
            msg.markRead();
            readCount++;
            if (msg.getTaskId() != null) {
                InteractiveTask task = findTask(msg.getTaskId());
                if (task != null) {
                    completeObjective(task, ObjectiveType.READ_MESSAGE, msg.getId());
                    if (focusedTaskId == null) {
                        focusedTaskId = task.getId();
                        task.setJiraStatus("IN PROGRESS");
                    }
                    tryCompleteTask(task);
                }
            }
        }
        if (readCount > 0) {
            lastMessage = "Прочитано сообщений: " + readCount;
        } else {
            lastMessage = "Нет новых сообщений";
        }
        return ActionResult.ok(lastMessage);
    }

    public ActionResult readChannelMessages() {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        int readCount = 0;
        for (ChatMessage msg : messages) {
            if (msg.isFromPlayer() || msg.isRead()) {
                continue;
            }
            msg.markRead();
            readCount++;
            if (msg.getTaskId() != null) {
                InteractiveTask task = findTask(msg.getTaskId());
                if (task != null) {
                    completeObjective(task, ObjectiveType.READ_MESSAGE, msg.getId());
                    if (focusedTaskId == null) {
                        focusedTaskId = task.getId();
                        task.setJiraStatus("IN PROGRESS");
                    }
                    tryCompleteTask(task);
                }
            }
        }
        if (readCount > 0) {
            lastMessage = "Прочитано сообщений: " + readCount;
        } else {
            lastMessage = "Нет новых сообщений";
        }
        return ActionResult.ok(lastMessage);
    }

    public ActionResult readMessage(String messageId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        ChatMessage msg = messages.stream().filter(m -> m.getId().equals(messageId)).findFirst().orElse(null);
        if (msg == null) {
            return ActionResult.fail("Сообщение не найдено");
        }
        msg.markRead();

        if (msg.getTaskId() != null) {
            focusTask(msg.getTaskId());
            InteractiveTask task = findTask(msg.getTaskId());
            if (task != null) {
                completeObjective(task, ObjectiveType.READ_MESSAGE, msg.getId());
            }
        }

        lastMessage = "Прочитано сообщение";
        tryCompleteTask(findTask(msg.getTaskId()));
        return ActionResult.ok(lastMessage);
    }

    public ActionResult sendMessage(String contactId, String text, String replyOptionId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }

        if (replyOptionId != null && replyOptionId.startsWith("workload-")) {
            ActionResult workload = handleWorkloadReply(contactId, replyOptionId, text);
            if (workload != null) {
                return workload;
            }
        }

        if (replyOptionId != null && replyOptionId.startsWith("explorer-ask")) {
            ActionResult explorer = handleExplorerWorkRequest(contactId, replyOptionId, text);
            if (explorer != null) {
                return explorer;
            }
        }

        InteractiveTask task = findTaskForContact(contactId, replyOptionId);

        String messageText = text != null ? text.trim() : "";
        boolean correct = true;
        String feedback = null;

        if (replyOptionId != null) {
            ReplyOption option = findReplyOption(replyOptionId);
            if (option != null) {
                if (task == null) {
                    task = findTaskByReplyOption(replyOptionId);
                }
                messageText = option.text();
                correct = option.correct();
                feedback = option.feedback();
            }
        }

        if (messageText.isBlank()) {
            return ActionResult.fail("Пустое сообщение");
        }

        messages.add(new ChatMessage("msg-player-" + System.nanoTime(), contactId, messageText, true,
                task != null ? task.getId() : null));

        TaskObjective replyObjective = task != null ? task.findObjective(ObjectiveType.REPLY_MESSAGE) : null;
        boolean expectsReply = replyObjective != null && contactId.equals(replyObjective.getContactId());

        if (replyOptionId != null && task != null && expectsReply) {
            if (correct || replyOptionId.equals(replyObjective.getCorrectReplyId())) {
                replyObjective.complete();
                advanceTime(1);
                if (task.getScenarioTag() == ScenarioTag.CODE_REVIEW_METHOD
                        || task.getScenarioTag() == ScenarioTag.CODE_REVIEW_STYLE
                        || task.getScenarioTag() == ScenarioTag.CODE_REVIEW_SECURITY) {
                    deliverPr301FollowUp();
                }
            } else if (!correct) {
                player.addStress(15);
                player.addColleagueRating(-1);
                lastMessage = formatNpcFeedback(feedback, contactId);
                if (feedback != null) {
                    messages.add(new ChatMessage("msg-reply-" + System.nanoTime(), contactId,
                            formatNpcFeedback(feedback, contactId), false, task.getId()));
                }
                return ActionResult.ok(lastMessage + " (+стресс)");
            }
        } else if (replyOptionId == null) {
            if (pendingWorkloadContactId != null && pendingWorkloadContactId.equals(contactId)) {
                ActionResult workload = handleWorkloadReply(contactId, null, messageText);
                if (workload != null) {
                    return workload;
                }
            }
            String npcReply = handleFreeTextReply(contactId, messageText, task, expectsReply);
            if (npcReply != null) {
                messages.add(new ChatMessage("msg-reply-" + System.nanoTime(), contactId,
                        formatNpcFeedback(npcReply, contactId), false,
                        task != null ? task.getId() : null));
                lastMessage = formatNpcFeedback(npcReply, contactId);
                tryCompleteTask(task);
                return ActionResult.ok(lastMessage);
            }
        }

        if (feedback != null) {
            messages.add(new ChatMessage("msg-reply-" + System.nanoTime(), contactId,
                    formatNpcFeedback(feedback, contactId), false,
                    task != null ? task.getId() : null));
        }

        lastMessage = "Сообщение отправлено";
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage);
    }

    private String handleFreeTextReply(String contactId, String text, InteractiveTask task, boolean expectsReply) {
        String lower = text.toLowerCase(Locale.ROOT);
        ChatTextAnalyzer.Kind kind = ChatTextAnalyzer.classify(text);
        long priorProfanity = countPlayerProfanityMessages();

        switch (kind) {
            case PROFANITY -> {
                player.addStress(12);
                player.addColleagueRating(-2);
                boolean warned = addWarningIfAllowed("Нецензурная лексика в рабочем чате");
                String body = warned
                        ? "Это рабочий чат. Без мата, пожалуйста — HR уже получил уведомление. (⚠ предупреждение)"
                        : priorProfanity > 0
                        ? "Повторяю: в корпоративном Slack так нельзя. Давай по-человечески."
                        : "Это рабочий чат. Так писать коллегам нельзя — давай без грубостей.";
                return wrapNpcReply(contactId, body + " (+стресс)");
            }
            case RUDE -> {
                player.addStress(8);
                player.addColleagueRating(-1);
                return wrapNpcReply(contactId, "Давай без personal attacks — мы же профессионалы? (+стресс)");
            }
            case RESIGNATION -> {
                player.addStress(8);
                player.addColleagueRating(-1);
                boolean warned = addWarningIfAllowed("Заявление об уходе в рабочем чате");
                String body = warned
                        ? "Такие темы — с HR или тимлидом лично, не в Slack. HR уже в курсе. (⚠ предупреждение)"
                        : "Если серьёзно про уход — поговори с HR или тимлидом, в общем чате так не решают.";
                return wrapNpcReply(contactId, body + " (+стресс)");
            }
            case GREETING -> {
                return wrapNpcReply(contactId, greetingResponse(contactId));
            }
            case THANKS -> {
                return wrapNpcReply(contactId, thanksResponse(contactId));
            }
            case QUESTION -> {
                if (expectsReply && task != null) {
                    player.addStress(5);
                    return wrapNpcReply(contactId, "Хороший вопрос, но по задаче " + task.getTicketId()
                            + " лучше " + hintForReply(task).toLowerCase(Locale.ROOT) + " (+стресс)");
                }
                return wrapNpcReply(contactId, questionResponse(contactId));
            }
            case OFF_TOPIC -> {
                player.addStress(5);
                return wrapNpcReply(contactId, "Ок, но у нас рабочий день — есть задачи в JIRA 🙂 (+стресс)");
            }
            case SMALL_TALK -> {
                if (!expectsReply) {
                    return wrapNpcReply(contactId, welcomeSmallTalkResponse(contactId, lower));
                }
            }
            default -> {
                // fall through
            }
        }

        if (expectsReply && task != null) {
            player.addStress(10);
            player.addColleagueRating(-1);
            return wrapNpcReply(contactId, "Это не совсем то, что я ждала. "
                    + hintForReply(task) + " (+стресс)");
        }

        if (!expectsReply && mode.isNoCode()
                && contactId.equals(projectProfile.team().get(0).id())
                && countOpenWorkTasks() == 0
                && isAskingForWork(lower)
                && bonusTasksInjectedToday < maxExplorerBonusTasksPerDay()) {
            boolean injected = injectBonusTask(System.currentTimeMillis(),
                    projectProfile.team().get(0).name() + " выдал задачу");
            if (injected) {
                return projectProfile.team().get(0).name()
                        + ": «Ок! Закинула в JIRA — смотри Slack и чеклист слева.»";
            }
            return projectProfile.team().get(0).name()
                    + ": «На сегодня всё разобрали. Можешь отдохнуть или завершить день.»";
        }

        return wrapNpcReply(contactId, genericAckResponse(contactId, text));
    }

    private long countPlayerProfanityMessages() {
        return messages.stream()
                .filter(ChatMessage::isFromPlayer)
                .filter(m -> ChatTextAnalyzer.containsProfanity(m.getText()))
                .count();
    }

    private String wrapNpcReply(String contactId, String body) {
        return contactName(contactId) + ": «" + body + "»";
    }

    private String thanksResponse(String contactId) {
        return switch (contactId) {
            case "anna" -> "Не за что! Обращайся.";
            case "igor" -> "Ок, работаем дальше.";
            case "alex" -> "Пожалуйста! Когда будешь готов — пиши по PR.";
            case "maria" -> "Не за что! Дай знать, когда возьмёшь задачу.";
            default -> "Пожалуйста! Если что — пиши.";
        };
    }

    private String questionResponse(String contactId) {
        return switch (contactId) {
            case "alex" -> "Глянь JIRA — там приоритеты. Если застрянешь — пингани.";
            case "maria" -> "Смотри задачи в JIRA, напишу если нужны уточнения.";
            case "anna" -> "Начни с чеклиста в JIRA — я на связи, если что.";
            case "igor" -> "Приоритеты в канале и JIRA. На daily обсудим детали.";
            default -> "Хороший вопрос — начни с JIRA и чеклиста слева, я на связи.";
        };
    }

    private String genericAckResponse(String contactId, String text) {
        String[] pool = {
                "Понял, спасибо!",
                "Ок, на связи 👍",
                "Принято, вернусь если будут вопросы.",
                "Увидел сообщение — если срочно, напиши ещё раз.",
                "Ок! Если это про задачу — гляну JIRA чуть позже."
        };
        int idx = Math.floorMod(text != null ? text.hashCode() : contactId.hashCode(), pool.length);
        String line = pool[idx];
        if ("alex".equals(contactId) || "maria".equals(contactId)) {
            line = "Ок! Если про код — гляну после текущего шага в JIRA.";
        }
        return line;
    }

    private static boolean isWelcomeSmallTalk(String lower) {
        return lower.matches(".*(спасибо|благодар|рад быть|готов к работе|готов к|понял[,!]?\\s*спасибо|"
                + "с чего начать|с чего старт|что делать|куда смотреть|посмотрю задач|привет! сейчас).*");
    }

    private String welcomeSmallTalkResponse(String contactId, String lower) {
        if (lower.matches(".*(с чего начать|с чего старт|что делать|куда смотреть|что в работе|первая задача).*")) {
            return switch (contactId) {
                case "alex" -> "Открой JIRA — там первая задача на сегодня. Если застрянешь — пингуй в канале.";
                case "maria" -> "Глянь JIRA и напиши, когда будешь готов к тестам.";
                case "anna" -> "Начни с чеклиста в JIRA — я на связи, если что.";
                case "igor" -> "Сначала daily, потом JIRA. Приоритеты в канале.";
                case "dmitry" -> "Смотри алерты в Grafana и задачи в JIRA.";
                case "elena" -> "Загляни в JIRA — там тикет на фронт.";
                case "nikita" -> "Спроси у сеньора в канале или открой JIRA — подскажу.";
                default -> "Загляни в JIRA — там первая задача. Я на связи!";
            };
        }
        return switch (contactId) {
            case "anna" -> "Рад видеть в команде! Если вопросы — пиши.";
            case "alex" -> "Отлично! Когда будешь готов — работай по задачам в JIRA.";
            case "maria" -> "Супер! Напиши, когда возьмёшь задачу в работу.";
            case "igor" -> "Добро пожаловать! Приоритеты обсудим на daily.";
            case "dmitry" -> "Ок! Если что по инфре — пиши.";
            case "elena" -> "Рада! Задачи в JIRA, если нужна помощь — в канале.";
            case "nikita" -> "Круто! Не стесняйся спрашивать — мы все через это проходили.";
            default -> "Супер! Задачи в JIRA, если что — напиши.";
        };
    }

    private String greetingResponse(String contactId) {
        return switch (contactId) {
            case "anna" -> "Рад видеть! Если будут вопросы — пиши.";
            case "alex" -> "Привет! Когда будешь готов — глянь PR #247.";
            case "maria" -> "Привет! JIRA-142 ждёт фикса 🙏";
            case "igor" -> "Привет! Не забудь про daily через 10 минут.";
            case "dmitry" -> "Привет. Если prod горит — сразу в #war-room.";
            default -> "Привет! Рад, что на связи — если что, пиши.";
        };
    }

    private String hintForReply(InteractiveTask task) {
        return switch (task.getTicketId()) {
            case "JIRA-142" -> "Напиши, когда пофиксишь NPE и PR будет готов";
            case "PR-247" -> "Нужен фидбек по ревью PR #247";
            case "INC-501" -> "Нужен статус по hotfix на prod";
            case "INC-502" -> "Нужен статус по OOM / heap dump";
            case "KAFKA-101" -> "Нужен статус по consumer lag";
            case "PR-301" -> "Объясни проблему @Transactional";
            case "OBS-101" -> "Отчёт по SLA интеграций";
            default -> "Ответь по существу задачи";
        };
    }

    private String contactName(String contactId) {
        return getContacts().stream()
                .filter(c -> c.id().equals(contactId))
                .map(Contact::name)
                .findFirst()
                .orElse("Коллега");
    }

    public ActionResult runTests(String taskId, String code) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        ActionResult noCode = noCodeBlocked();
        if (noCode != null) {
            return noCode;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        editorCode.put(taskId, code);

        CodeValidator.ValidationResult result = CodeValidator.runTests(code, task.getCodeChallenge());
        consoleOutput = result.consoleLines();

        if (result.passed()) {
            task.setTestsPassed(true);
            TaskObjective obj = task.findObjective(ObjectiveType.RUN_TESTS);
            if (obj != null) {
                obj.complete();
            }
            TaskObjective review = task.findObjective(ObjectiveType.REVIEW_CODE);
            if (review != null) {
                review.complete();
            }
            advanceTime(1);
            lastMessage = result.summary();
        } else {
            lastMessage = result.summary() + " — исправьте код и запустите снова";
        }

        tryCompleteTask(task);
        return ActionResult.ok(lastMessage, result.consoleLines());
    }

    public ActionResult submitCode(String taskId, String code) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        ActionResult noCode = noCodeBlocked();
        if (noCode != null) {
            return noCode;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        editorCode.put(taskId, code);

        CodeValidator.ValidationResult result = CodeValidator.submitFix(code, task.getCodeChallenge());
        consoleOutput = result.consoleLines();

        if (!result.passed()) {
            lastMessage = result.summary();
            return ActionResult.ok(lastMessage, result.consoleLines());
        }

        TaskObjective fixObj = task.findObjective(ObjectiveType.SUBMIT_FIX);
        if (fixObj != null) {
            fixObj.complete();
        }
        advanceTime(task.getDurationHours() > 1 ? 2 : 1);
        lastMessage = result.summary() + " Локальный коммит создан — нажмите Push в IntelliJ.";
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage, result.consoleLines());
    }

    public ActionResult pushCode(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        ActionResult noCode = noCodeBlocked();
        if (noCode != null) {
            return noCode;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }

        TaskObjective submitFix = task.findObjective(ObjectiveType.SUBMIT_FIX);
        if (submitFix != null && !submitFix.isCompleted()) {
            return ActionResult.fail("Сначала исправьте код и нажмите Commit Fix");
        }
        if (submitFix == null && task.getCodeChallenge() != null && !task.isTestsPassed()) {
            return ActionResult.fail("Сначала запустите тесты и закоммитьте фикс");
        }

        TaskObjective pushObj = task.findObjective(ObjectiveType.GIT_PUSH);
        boolean updateAfterReview = task.getPullRequestNumber() > 0
                && "CHANGES_REQUESTED".equals(task.getPullRequestStatus());
        if (pushObj != null && pushObj.isCompleted() && !updateAfterReview) {
            return ActionResult.fail("Ветка уже запушена в origin");
        }

        String branch = "fix/" + task.getTicketId().toLowerCase().replace('_', '-');
        String repo = projectProfile.companyName().toLowerCase().replaceAll("[^a-z0-9]+", "-");
        List<String> console = new ArrayList<>(List.of(
                "$ git status",
                "On branch " + branch,
                "nothing to commit, working tree clean",
                "",
                "$ git push origin " + branch + (updateAfterReview ? "  # force-with-lease" : ""),
                "Enumerating objects: 9, done.",
                "Counting objects: 100% (9/9), done.",
                "Writing objects: 100% (5/5), 612 bytes | 612.00 KiB/s, done.",
                "To github.com:acme/" + repo + ".git",
                "   a3f91c2..c8e44d1  " + branch + " -> " + branch
        ));
        consoleOutput = console;

        if (pushObj != null && !pushObj.isCompleted()) {
            pushObj.complete();
        }
        if (updateAfterReview) {
            task.setPullRequestStatus("OPEN");
            console.add("");
            console.add("PR #" + task.getPullRequestNumber() + " updated — re-request review in GitHub.");
        }
        advanceTime(1);
        if (task.findObjective(ObjectiveType.CREATE_PR) != null && task.getPullRequestNumber() == 0) {
            lastMessage = "Запушено: origin/" + branch + ". Создайте Pull Request в GitHub.";
        } else if (updateAfterReview) {
            lastMessage = "Ветка обновлена. Запросите review снова в GitHub.";
        } else {
            lastMessage = "Запушено: origin/" + branch + ".";
        }
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage, console);
    }

    public ActionResult createPullRequest(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        TaskObjective prObj = task.findObjective(ObjectiveType.CREATE_PR);
        if (prObj == null) {
            return ActionResult.fail("Для этой задачи PR не требуется");
        }
        if (prObj.isCompleted() || task.getPullRequestNumber() > 0) {
            return ActionResult.fail("PR уже создан");
        }
        TaskObjective pushObj = task.getObjectives().stream()
                .filter(o -> o.getType() == ObjectiveType.GIT_PUSH)
                .findFirst()
                .orElse(null);
        if (pushObj != null && !pushObj.isCompleted()) {
            return ActionResult.fail("Сначала запушьте ветку (IntelliJ → Push)");
        }

        int prNumber = PR_NUMBERS.getOrDefault(task.getTicketId(),
                240 + Math.abs(task.getTicketId().hashCode() % 50));
        String branchPrefix = task.getType() == TaskType.FEATURE ? "feature/" : "fix/";
        String branch = branchPrefix + task.getTicketId().toLowerCase().replace('_', '-');
        task.setPullRequestNumber(prNumber);
        task.setPullRequestStatus("OPEN");
        prObj.complete();
        advanceTime(1);
        lastMessage = "PR #" + prNumber + " создан (" + branch + " → main). Запросите code review.";
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage, List.of(
                "Opened pull request #" + prNumber,
                task.getTicketId() + ": " + task.getTitle(),
                branch + " → main"
        ));
    }

    public ActionResult requestPrReview(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        if (task.getPullRequestNumber() == 0) {
            return ActionResult.fail("Сначала создайте Pull Request");
        }
        TaskObjective reviewObj = task.findObjective(ObjectiveType.REQUEST_REVIEW);
        if (reviewObj == null) {
            return ActionResult.fail("Review не требуется");
        }
        if (reviewObj.isCompleted()) {
            return ActionResult.fail("Review уже запрошен");
        }
        if (!Set.of("OPEN", "CHANGES_REQUESTED").contains(task.getPullRequestStatus())) {
            return ActionResult.fail("PR не готов к запросу review");
        }

        task.setPullRequestStatus("REVIEW_REQUESTED");
        task.setReviewerContactId(DEFAULT_REVIEWER);
        reviewObj.complete();
        advanceTime(1);
        lastMessage = "Review запрошен у @" + DEFAULT_REVIEWER + " для PR #" + task.getPullRequestNumber();
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage, List.of(
                "Reviewers: @" + DEFAULT_REVIEWER,
                "Status: Review requested"
        ));
    }

    public ActionResult checkPrReview(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        if (task.getPullRequestNumber() == 0) {
            return ActionResult.fail("Нет открытого PR");
        }
        if (!"REVIEW_REQUESTED".equals(task.getPullRequestStatus())) {
            return ActionResult.fail("Сначала запросите review");
        }

        String code = editorCode.getOrDefault(taskId,
                task.getCodeChallenge() != null ? task.getCodeChallenge().starterCode() : "");
        CodeValidator.ValidationResult result = CodeValidator.submitFix(code, task.getCodeChallenge());
        String reviewer = task.getReviewerContactId() != null ? task.getReviewerContactId() : DEFAULT_REVIEWER;
        advanceTime(1);

        if (!result.passed()) {
            task.setPullRequestStatus("CHANGES_REQUESTED");
            resetReviewObjectives(task);
            messages.add(new ChatMessage(
                    "msg-review-changes-" + System.nanoTime(),
                    reviewer,
                    "PR #" + task.getPullRequestNumber() + ": нужны правки — " + result.summary(),
                    false,
                    task.getId()
            ));
            lastMessage = "@" + reviewer + " запросил изменения в PR #" + task.getPullRequestNumber();
            return ActionResult.ok(lastMessage, List.of(
                    "Review: Changes requested",
                    result.summary()
            ));
        }

        task.setPullRequestStatus("APPROVED");
        messages.add(new ChatMessage(
                "msg-review-approve-" + System.nanoTime(),
                reviewer,
                "PR #" + task.getPullRequestNumber() + ": LGTM ✅ Approved",
                false,
                task.getId()
        ));
        lastMessage = "PR #" + task.getPullRequestNumber() + " approved — влейте через git merge в IntelliJ (вкладка Git)";
        return ActionResult.ok(lastMessage, List.of(
                "Review: Approved",
                "@" + reviewer + ": LGTM"
        ));
    }

    public ActionResult mergePullRequest(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }
        TaskObjective mergeObj = task.findObjective(ObjectiveType.MERGE_PR);
        if (mergeObj == null) {
            return ActionResult.fail("Merge не требуется");
        }
        if (mergeObj.isCompleted()) {
            return ActionResult.fail("PR уже влит");
        }
        if (!"APPROVED".equals(task.getPullRequestStatus())) {
            return ActionResult.fail("PR ещё не approved — дождитесь ревью в GitHub");
        }

        String branchPrefix = task.getType() == TaskType.FEATURE ? "feature/" : "fix/";
        String branch = branchPrefix + task.getTicketId().toLowerCase().replace('_', '-');
        String repo = projectProfile.companyName().toLowerCase().replaceAll("[^a-z0-9]+", "-");
        String fileName = task.getCodeChallenge() != null ? task.getCodeChallenge().fileName() : "changes";

        List<String> console = List.of(
                "$ git checkout main",
                "Switched to branch 'main'",
                "Your branch is up to date with 'origin/main'.",
                "",
                "$ git merge --no-ff " + branch,
                "Merge made by the 'ort' strategy.",
                " " + fileName + " | 12 +++++++++---",
                "",
                "$ git push origin main",
                "Enumerating objects: 5, done.",
                "Writing objects: 100% (3/3), 421 bytes | 421.00 KiB/s, done.",
                "To github.com:acme/" + repo + ".git",
                "   d4e8f12..a91bc34  main -> main"
        );
        consoleOutput = console;

        task.setPullRequestStatus("MERGED");
        mergeObj.complete();
        advanceTime(1);
        lastMessage = "PR #" + task.getPullRequestNumber() + " влит в main через git merge";
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage, console);
    }

    private void resetReviewObjectives(InteractiveTask task) {
        task.getObjectives().stream()
                .filter(o -> o.getType() == ObjectiveType.REQUEST_REVIEW
                        || o.getType() == ObjectiveType.MERGE_PR)
                .forEach(TaskObjective::reset);
    }

    public ActionResult transitionJiraStatus(String taskId, String status) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null || task.isCompleted()) {
            return ActionResult.fail("Задача недоступна");
        }
        String target = normalizeJiraStatus(status);
        return switch (target) {
            case "TO DO" -> reopenJira(task);
            case "IN PROGRESS" -> focusTask(taskId);
            case "DONE" -> closeJira(taskId);
            default -> ActionResult.fail("Неизвестный статус: " + status);
        };
    }

    private ActionResult reopenJira(InteractiveTask task) {
        if ("DONE".equals(normalizeJiraStatus(task.getJiraStatus()))) {
            return ActionResult.fail("Задача уже закрыта");
        }
        task.setJiraStatus("TO DO");
        if (task.getId().equals(focusedTaskId)) {
            focusedTaskId = null;
        }
        lastMessage = task.getTicketId() + " → To Do";
        return ActionResult.ok(lastMessage);
    }

    private static String normalizeJiraStatus(String status) {
        if (status == null || status.isBlank()) {
            return "TO DO";
        }
        String normalized = status.toUpperCase().replace('_', ' ').trim();
        if (normalized.equals("DONE") || normalized.equals("CLOSED")) {
            return "DONE";
        }
        if (normalized.contains("PROGRESS")) {
            return "IN PROGRESS";
        }
        if (normalized.equals("OPEN") || normalized.equals("TO DO") || normalized.equals("TODO")) {
            return "TO DO";
        }
        return normalized;
    }

    public ActionResult closeJira(String taskId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        InteractiveTask task = findTask(taskId);
        if (task == null) {
            return ActionResult.fail("Задача не найдена");
        }

        TaskObjective jiraObj = task.findObjective(ObjectiveType.CLOSE_JIRA);
        if (jiraObj == null) {
            return ActionResult.fail("Нет цели закрытия JIRA");
        }

        long pending = task.getObjectives().stream().filter(o -> !o.isCompleted()
                && o.getType() != ObjectiveType.CLOSE_JIRA).count();
        if (pending > 0) {
            return ActionResult.fail("Сначала выполните: "
                    + task.getObjectives().stream()
                    .filter(o -> !o.isCompleted() && o.getType() != ObjectiveType.CLOSE_JIRA)
                    .map(TaskObjective::getLabel)
                    .reduce((a, b) -> a + "; " + b).orElse(""));
        }

        jiraObj.complete();
        task.setJiraStatus("DONE");
        advanceTime(1);
        lastMessage = task.getTicketId() + " → Done";
        tryCompleteTask(task);
        return ActionResult.ok(lastMessage);
    }

    public ActionResult doRest(RestAction action, String dialogueChoice) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        if (dayEnded || gameOver) {
            return ActionResult.fail("Рабочий день окончен");
        }

        player.addStress(action.getStressChange());
        player.addHealth(action.getHealthChange());
        player.addExp(action.getExpGain());
        player.addEnergy(action.getEnergyChange());
        applyRestDialogueEffects(action, dialogueChoice);
        dayRecord.recordRest(action);

        if (dayRecord.didNoWork() && (action == RestAction.SLEEP || action == RestAction.FRIENDS)) {
            player.addStress(8);
            player.addColleagueRating(-1);
            lastMessage = action.getTitle() + " — коллеги заметили, что вы не работали";
        } else {
            lastMessage = action.getTitle() + ": " + action.getDescription();
        }

        if (action == RestAction.SLEEP) {
            dayStartedAtMillis = System.currentTimeMillis() - GameBalance.REAL_DAY_DURATION_MS;
            syncDayClockFromRealTime();
        } else {
            advanceTime(action.getDurationHours());
            lastMessage += String.format(" · +%dч → %s", action.getDurationHours(), getTimeLabel());
        }

        checkGameState();
        return ActionResult.ok(lastMessage);
    }

    private void applyRestDialogueEffects(RestAction action, String dialogueChoice) {
        if (dialogueChoice == null || dialogueChoice.isBlank()) {
            return;
        }
        switch (dialogueChoice) {
            case "coffee_gossip" -> {
                player.addColleagueRating(-1);
                player.addSoftSkills(1);
                lastMessage = "☕ Кофе + сплетни — коллеги запомнили";
            }
            case "coffee_focus" -> {
                player.addStress(-5);
                lastMessage = "☕ Кофе в тишине — сфокусировались";
            }
            case "coffee_network" -> {
                player.addColleagueRating(1);
                player.addSoftSkills(2);
                lastMessage = "☕ Кофе с коллегой — полезный networking";
            }
            case "gym_intense" -> player.addHealth(5);
            case "gym_light" -> player.addStress(-8);
            case "friends_vent" -> player.addStress(-12);
            case "mentor_career" -> {
                player.addExp(40);
                player.addSoftSkills(3);
            }
            default -> { /* noop */ }
        }
    }

    public ActionResult completeOpsAction(String appId, String actionId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        if (appId == null || actionId == null) {
            return ActionResult.fail("Не указано действие");
        }

        boolean matched = false;
        for (InteractiveTask task : dailyTasks) {
            if (task.isCompleted()) {
                continue;
            }
            for (TaskObjective obj : task.getObjectives()) {
                if (obj.isCompleted()) {
                    continue;
                }
                boolean opsMatch = false;
                if (obj.getType() == ObjectiveType.GUIDED_STEP && mode.isNoCode()) {
                    opsMatch = actionId.equals(obj.getMessageId());
                } else if (obj.getType() == ObjectiveType.CHECK_METRICS
                        || obj.getType() == ObjectiveType.HEAP_DUMP) {
                    opsMatch = appId.equals(obj.getContactId()) && actionId.equals(obj.getMessageId());
                }
                if (opsMatch) {
                    obj.complete();
                    matched = true;
                    advanceTime(1);
                    lastMessage = "✓ " + obj.getLabel();
                    tryCompleteTask(task);
                    return ActionResult.ok(lastMessage);
                }
            }
        }

        if (matched) {
            return ActionResult.ok(lastMessage);
        }
        lastMessage = "Действие выполнено: " + appId + "/" + actionId;
        return ActionResult.ok(lastMessage);
    }

    public ActionResult readEmail(String emailId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        EmailMessage email = emails.stream()
                .filter(e -> e.getId().equals(emailId))
                .findFirst()
                .orElse(null);
        if (email == null) {
            return ActionResult.fail("Письмо не найдено");
        }
        email.setRead(true);

        if (email.getTaskId() != null) {
            InteractiveTask task = findTask(email.getTaskId());
            if (task != null) {
                completeObjective(task, ObjectiveType.READ_EMAIL, emailId);
                tryCompleteTask(task);
            }
        } else {
            for (InteractiveTask task : dailyTasks) {
                completeObjective(task, ObjectiveType.READ_EMAIL, emailId);
                tryCompleteTask(task);
            }
        }

        lastMessage = "📧 Прочитано: " + email.getSubject();
        return ActionResult.ok(lastMessage);
    }

    public ActionResult handleEmailAction(String emailId, String actionId) {
        ActionResult gate = requireAtDesk();
        if (gate != null) {
            return gate;
        }
        EmailMessage email = emails.stream()
                .filter(e -> e.getId().equals(emailId))
                .findFirst()
                .orElse(null);
        if (email == null) {
            return ActionResult.fail("Письмо не найдено");
        }

        return switch (actionId) {
            case "report-phishing" -> {
                player.addSoftSkills(2);
                lastMessage = "🛡 IT: фишинг отправлен в SOC. Молодец!";
                yield ActionResult.ok(lastMessage);
            }
            case "mark-spam" -> {
                lastMessage = "🗑 Спам перемещён в Junk";
                yield ActionResult.ok(lastMessage);
            }
            case "reply-recruiter-polite" -> {
                player.addColleagueRating(-1);
                lastMessage = "📧 HR: используйте корп. email для офферов";
                yield ActionResult.ok(lastMessage);
            }
            case "archive" -> {
                lastMessage = "📁 Письмо в Archive";
                yield ActionResult.ok(lastMessage);
            }
            default -> ActionResult.fail("Неизвестное действие");
        };
    }

    public ActionResult endDay() {
        if (gameOver) {
            return ActionResult.fail("Игра окончена");
        }

        StringBuilder report = new StringBuilder();
        int unfinished = (int) dailyTasks.stream().filter(t -> !t.isCompleted()).count();

        for (InteractiveTask t : dailyTasks) {
            if (!t.isCompleted()) {
                dayRecord.recordTaskSkipped();
            }
        }

        int completed = dayRecord.getTasksCompleted();
        int dailySalary = CompensationCalculator.calculateDailyPayout(player, completed, unfinished);
        player.addMoney(dailySalary);

        report.append("📋 Итоги дня ").append(player.getDay()).append(":\n");
        report.append("• Закрыто задач: ").append(completed).append("\n");
        report.append("• Незакрытых: ").append(unfinished).append("\n");
        report.append("• Зарплата: ").append(CompensationCalculator.formatSignedRubles(dailySalary)).append("\n");
        applySanctions(report, unfinished);

        List<InteractiveTask> carryOver = dailyTasks.stream().filter(t -> !t.isCompleted()).toList();
        player.nextDay();
        resetDayState();

        dailyTasks = new ArrayList<>(carryOver);
        for (InteractiveTask fresh : ScenarioLibrary.createDailyTasks(
                mode, player.getDay(), projectProfile, player.getExperienceYears())) {
            if (carryOver.stream().noneMatch(c -> c.getTicketId().equals(fresh.getTicketId()))) {
                dailyTasks.add(fresh);
                if (fresh.getCodeChallenge() != null) {
                    editorCode.put(fresh.getId(), fresh.getCodeChallenge().starterCode());
                }
            }
        }
        messages.addAll(ScenarioLibrary.initialMessages(
                dailyTasks.stream()
                        .filter(t -> carryOver.stream().noneMatch(c -> c.getTicketId().equals(t.getTicketId())))
                        .toList(),
                projectProfile, player.getName(), false,
                player.getExperienceYears(), mode, player.getDay()));
        refreshEmails();

        lastMessage = report.toString();
        checkGameState();
        return ActionResult.ok(report.toString());
    }

    private void tryCompleteTask(InteractiveTask task) {
        if (task == null || task.isCompleted() || !task.allObjectivesDone()) {
            return;
        }
        completeTaskRewards(task);
    }

    private void completeTaskRewards(InteractiveTask task) {
        task.setCompleted(true);
        TaskType type = task.getType();
        double stressMult = mode.isSoftHr() ? 0 : mode.getStressMultiplier();

        player.addExp(type.getExpReward());
        player.addMoney(CompensationCalculator.taskCompletionBonus(player, type));
        player.addStress((int) (type.getStressCost() * stressMult));
        player.addJavaSkill(type.getJavaSkillGain());
        player.addCodeQuality(type.getCodeQualityGain());
        player.addEnergy(-type.getEnergyCost());
        dayRecord.recordTaskCompleted(task.getDurationHours());

        lastMessage = "✅ " + task.getTicketId() + " закрыта! +" + type.getExpReward() + " EXP";
        if (focusedTaskId != null && focusedTaskId.equals(task.getId())) {
            focusedTaskId = null;
        }
        checkGameState();
    }

    private void completeObjective(InteractiveTask task, ObjectiveType type, String messageId) {
        for (TaskObjective obj : task.getObjectives()) {
            if (obj.getType() == type && !obj.isCompleted()) {
                if (messageId == null || messageId.equals(obj.getMessageId())) {
                    obj.complete();
                    return;
                }
            }
        }
        if (messageId != null && type == ObjectiveType.READ_MESSAGE) {
            String canonical = ScenarioLibrary.primarySlackMessageId(task);
            if (messageId.equals(canonical)) {
                for (TaskObjective obj : task.getObjectives()) {
                    if (obj.getType() == type && !obj.isCompleted()) {
                        obj.complete();
                        return;
                    }
                }
            }
        }
    }

    private InteractiveTask findTask(String taskId) {
        return dailyTasks.stream().filter(t -> t.getId().equals(taskId)).findFirst().orElse(null);
    }

    private InteractiveTask findTaskForContact(String contactId) {
        return findTaskForContact(contactId, null);
    }

    private InteractiveTask findTaskForContact(String contactId, String replyOptionId) {
        if (replyOptionId != null && !replyOptionId.isBlank()) {
            InteractiveTask byOption = findTaskByReplyOption(replyOptionId);
            if (byOption != null) {
                return byOption;
            }
        }
        for (InteractiveTask t : dailyTasks) {
            if (t.isCompleted()) {
                continue;
            }
            TaskObjective reply = t.findObjective(ObjectiveType.REPLY_MESSAGE);
            if (reply != null && !reply.isCompleted() && contactId.equals(reply.getContactId())) {
                return t;
            }
        }
        for (InteractiveTask t : dailyTasks) {
            if (t.isCompleted()) {
                continue;
            }
            TaskObjective read = t.findObjective(ObjectiveType.READ_MESSAGE);
            if (read != null && !read.isCompleted() && contactId.equals(read.getContactId())) {
                return t;
            }
        }
        return dailyTasks.stream()
                .filter(t -> !t.isCompleted())
                .filter(t -> messages.stream().anyMatch(m -> contactId.equals(m.getContactId())
                        && t.getId().equals(m.getTaskId())))
                .findFirst()
                .orElse(null);
    }

    private InteractiveTask findTaskByReplyOption(String replyOptionId) {
        for (InteractiveTask t : dailyTasks) {
            if (t.isCompleted()) {
                continue;
            }
            if (t.getReplyOptions().stream().anyMatch(r -> r.id().equals(replyOptionId))) {
                return t;
            }
        }
        return null;
    }

    private ReplyOption findReplyOption(String replyOptionId) {
        for (InteractiveTask t : dailyTasks) {
            for (ReplyOption option : t.getReplyOptions()) {
                if (option.id().equals(replyOptionId)) {
                    return option;
                }
            }
        }
        return null;
    }

    private void deliverPr301FollowUp() {
        InteractiveTask pr301 = dailyTasks.stream()
                .filter(t -> t.getScenarioTag() == ScenarioTag.TRANSACTIONAL_TRAP && !t.isCompleted())
                .findFirst()
                .orElse(null);
        if (pr301 == null) {
            return;
        }
        if (messages.stream().anyMatch(m -> "msg-alex-interview".equals(m.getId()))) {
            return;
        }
        messages.add(ScenarioLibrary.pr301FollowUpMessage(player.getName(), pr301.getId()));
    }

    /** Убирает «Алексей: «…»» — имя уже показано в UI чата. */
    private String formatNpcFeedback(String feedback, String contactId) {
        if (feedback == null || feedback.isBlank()) {
            return feedback;
        }
        String trimmed = feedback.trim();
        int open = trimmed.indexOf('«');
        int close = trimmed.lastIndexOf('»');
        if (open >= 0 && close > open) {
            return trimmed.substring(open + 1, close);
        }
        String name = contactName(contactId);
        if (trimmed.startsWith(name + ":")) {
            return trimmed.substring(name.length() + 1).trim();
        }
        return trimmed;
    }

    private boolean addWarningIfAllowed(String reason) {
        int maxPerDay = mode.isSoftHr()
                ? GameBalance.MAX_WARNINGS_PER_DAY_LEARNING
                : Integer.MAX_VALUE;
        if (dayRecord.canIssueWarning(maxPerDay)) {
            player.addWarning(reason);
            dayRecord.recordWarningIssued();
            return true;
        }
        return false;
    }

    private void issueWarningIfAllowed(StringBuilder report, String reason, String reportLine) {
        if (addWarningIfAllowed(reason)) {
            report.append(reportLine);
        }
    }

    private void applySanctions(StringBuilder report, int unfinished) {
        boolean learning = mode.isSoftHr();
        int day = player.getDay();

        if (dayRecord.didNoWork()) {
            player.incrementConsecutiveNoWorkDays();
            if (learning && day < 2) {
                report.append("\n💡 Первый день — можно закрыть задачи завтра, без штрафа.");
            } else {
                player.addColleagueRating(-2);
                player.addStress(learning ? 15 : 25);
                player.addMoney(-CompensationCalculator.noWorkDayPenalty(player));
                issueWarningIfAllowed(report,
                        "Ноль закрытых задач за рабочий день",
                        "\n🚨 САНКЦИЯ: Ноль задач! Team Lead недоволен. (⚠ предупреждение)");
            }
        } else {
            player.resetConsecutiveNoWorkDays();
        }
        if (dayRecord.slackedAllDay() && (!learning || day >= 3)) {
            player.addColleagueRating(-1);
            player.addStress(15);
            issueWarningIfAllowed(report,
                    "Прогул — день без продуктивной работы",
                    "\n⚠️ HR: прогулы зафиксированы. (⚠ предупреждение)");
        }
        if (unfinished > 0) {
            player.addStress(unfinished * (learning ? 6 : 10));
            player.addColleagueRating(-unfinished);
            if (unfinished >= 2 && (!learning || day >= 3)) {
                issueWarningIfAllowed(report,
                        "Срыв дедлайнов — " + unfinished + " задач не закрыты",
                        "\n⚠️ Дедлайны сорваны — эскалация на Team Lead");
            }
            report.append("\n📌 ").append(unfinished).append(" задач перенесено (+стресс)");
        }
    }

    private void resetDayState() {
        dayRecord.reset();
        hoursRemaining = WORK_DAY_HOURS;
        currentHour = DAY_START_HOUR;
        currentMinute = 0;
        dayStartedAtMillis = 0;
        dayEnded = false;
        focusedTaskId = null;
        atDesk = false;
        lateMinutes = 0;
        pendingMeeting = null;
        queuedMeeting = null;
        scheduledDailyStandup = null;
        meetingMissedToday = false;
        sprintSyncAttendedToday = false;
        pendingWorkloadContactId = null;
        lastBonusInjectionMs = 0;
        bonusTasksInjectedToday = 0;
        workIdleSinceMs = 0;
    }

    private void advanceTime(int hours) {
        if (hours <= 0) {
            syncDayClockFromRealTime();
            return;
        }
        ensureDayClockAnchored();
        if (dayStartedAtMillis <= 0) {
            syncDayClockFromRealTime();
            return;
        }
        long advanceMs = (long) hours * GameBalance.REAL_DAY_DURATION_MS / WORK_DAY_HOURS;
        dayStartedAtMillis -= advanceMs;
        syncDayClockFromRealTime();
    }

    private void checkGameState() {
        if (player.isBurnedOut()) {
            gameOver = true;
            gameOverReason = player.getHealth() <= 0
                    ? "Вы выгорели. Пора в отпуск!"
                    : "Стресс на максимуме.";
            return;
        }
        if (player.getLevel() >= 10 && player.getDay() >= GameBalance.MIN_GAME_DAYS) {
            gameOver = true;
            gameOverReason = "Middle Developer! 🎉";
            return;
        }

        boolean probation = mode.isSoftHr() && player.getDay() < GameBalance.MIN_DAY_BEFORE_TERMINATION;
        if (probation) {
            return;
        }

        if (player.isFired()) {
            gameOver = true;
            gameOverReason = "Уволены: " + player.getWarnings()
                    + " предупреждения и рейтинг " + player.getColleagueRating() + "/10. HR закрыл доступ.";
            return;
        }
        int noWorkLimit = mode.isSoftHr()
                ? GameBalance.CONSECUTIVE_NO_WORK_LEARNING
                : GameBalance.CONSECUTIVE_NO_WORK_DEFAULT;
        if (player.getConsecutiveNoWorkDays() >= noWorkLimit) {
            gameOver = true;
            gameOverReason = "Уволены: " + player.getConsecutiveNoWorkDays()
                    + " дня подряд без результата. Испытательный срок не пройден.";
            return;
        }
        int warnLimit = mode.isSoftHr()
                ? GameBalance.MAX_WARNINGS_LEARNING
                : GameBalance.MAX_WARNINGS_DEFAULT;
        if (player.getWarnings() >= warnLimit) {
            gameOver = true;
            gameOverReason = "Уволены: исчерпан лимит дисциплинарных предупреждений (" + player.getWarnings() + ").";
        }
    }

    public String getCareerStats() {
        return String.format(
                "📊 День %d | Lv.%d | %s | Java %d | Стресс %d%%",
                player.getDay(), player.getLevel(),
                CompensationCalculator.formatRubles(player.getMoney()),
                player.getJavaSkill(), player.getStress()
        );
    }

    public GameEngineSnapshot captureSnapshot() {
        return new GameEngineSnapshot(
                new PlayerSnapshot(
                        player.getName(),
                        player.getAge(),
                        player.getExperienceYears(),
                        player.getEducation().name(),
                        new ArrayList<>(player.getStackSkills()),
                        player.getCareerTitle(),
                        player.getLevel(),
                        player.getExp(),
                        player.getMoney(),
                        player.getStress(),
                        player.getHealth(),
                        player.getEnergy(),
                        player.getJavaSkill(),
                        player.getSoftSkills(),
                        player.getCodeQuality(),
                        player.getDay(),
                        player.getColleagueRating(),
                        player.getWarnings(),
                        player.getConsecutiveNoWorkDays(),
                        player.getHrWarnings().stream()
                                .map(w -> new GameEngineSnapshot.HrWarningSnapshot(w.day(), w.reason()))
                                .collect(Collectors.toList())
                ),
                mode.name(),
                projectProfile.type().name(),
                new DayRecordSnapshot(
                        dayRecord.getTasksCompleted(),
                        dayRecord.getTasksSkipped(),
                        dayRecord.getRestActions(),
                        dayRecord.getLeisureActions(),
                        dayRecord.getWorkHoursSpent()
                ),
                dailyTasks.stream().map(this::toTaskSnapshot).collect(Collectors.toList()),
                messages.stream().map(this::toMessageSnapshot).collect(Collectors.toList()),
                emails.stream().map(this::toEmailSnapshot).collect(Collectors.toList()),
                new HashMap<>(editorCode),
                new ArrayList<>(consoleOutput),
                focusedTaskId,
                lastMessage,
                gameOver,
                gameOverReason,
                hoursRemaining,
                currentHour,
                currentMinute,
                dayStartedAtMillis,
                dayEnded,
                atDesk,
                lateMinutes,
                pendingMeeting,
                queuedMeeting,
                scheduledDailyStandup,
                meetingMissedToday,
                projectProfile.team().stream().map(this::toTeamMemberSnapshot).collect(Collectors.toList()),
                wallpaperIndex,
                pendingWorkloadContactId,
                lastBonusInjectionMs,
                bonusTasksInjectedToday,
                workIdleSinceMs,
                sprintSyncAttendedToday
        );
    }

    private TeamMemberSnapshot toTeamMemberSnapshot(com.devsimulator.model.TeamMemberIntro member) {
        return new TeamMemberSnapshot(
                member.id(), member.name(), member.role(), member.avatar(), member.bio(), member.greeting());
    }

    private com.devsimulator.model.TeamMemberIntro fromTeamMemberSnapshot(TeamMemberSnapshot snapshot) {
        return new com.devsimulator.model.TeamMemberIntro(
                snapshot.id(), snapshot.name(), snapshot.role(), snapshot.avatar(),
                snapshot.bio(), snapshot.greeting());
    }

    public static InteractiveGameEngine fromSnapshot(GameEngineSnapshot snapshot) {
        Player player = Player.fromSnapshot(snapshot.player());
        List<com.devsimulator.model.TeamMemberIntro> team = snapshot.team() == null
                ? List.of()
                : snapshot.team().stream()
                .map(s -> new com.devsimulator.model.TeamMemberIntro(
                        s.id(), s.name(), s.role(), s.avatar(), s.bio(), s.greeting()))
                .toList();
        InteractiveGameEngine engine = new InteractiveGameEngine(
                player,
                GameMode.valueOf(snapshot.mode()),
                ProjectType.valueOf(snapshot.projectType()),
                team.isEmpty() ? null : team,
                true
        );
        engine.restoreSnapshot(snapshot);
        return engine;
    }

    private void restoreSnapshot(GameEngineSnapshot snapshot) {
        dayRecord.restoreState(
                snapshot.dayRecord().tasksCompleted(),
                snapshot.dayRecord().tasksSkipped(),
                snapshot.dayRecord().restActions(),
                snapshot.dayRecord().leisureActions(),
                snapshot.dayRecord().workHoursSpent()
        );
        dailyTasks = snapshot.dailyTasks().stream().map(this::fromTaskSnapshot).collect(Collectors.toCollection(ArrayList::new));
        messages = snapshot.messages().stream().map(this::fromMessageSnapshot).collect(Collectors.toCollection(ArrayList::new));
        emails = snapshot.emails().stream().map(this::fromEmailSnapshot).collect(Collectors.toCollection(ArrayList::new));
        editorCode.clear();
        editorCode.putAll(snapshot.editorCode());
        consoleOutput = new ArrayList<>(snapshot.consoleOutput());
        focusedTaskId = snapshot.focusedTaskId();
        lastMessage = snapshot.lastMessage();
        gameOver = snapshot.gameOver();
        gameOverReason = snapshot.gameOverReason();
        hoursRemaining = snapshot.hoursRemaining();
        currentHour = snapshot.currentHour();
        currentMinute = snapshot.currentMinute();
        dayStartedAtMillis = snapshot.dayStartedAtMillis();
        dayEnded = snapshot.dayEnded();
        atDesk = snapshot.atDesk();
        lateMinutes = snapshot.lateMinutes();
        pendingMeeting = snapshot.pendingMeeting();
        queuedMeeting = snapshot.queuedMeeting();
        scheduledDailyStandup = snapshot.scheduledDailyStandup();
        if (scheduledDailyStandup == null
                && pendingMeeting != null
                && pendingMeeting.id() != null
                && pendingMeeting.id().startsWith("daily-standup")) {
            int now = currentHour * 60 + currentMinute;
            if (now < GameBalance.standupStartMinutes()) {
                scheduledDailyStandup = pendingMeeting;
                pendingMeeting = null;
            }
        }
        meetingMissedToday = snapshot.meetingMissedToday();
        wallpaperIndex = snapshot.wallpaperIndex();
        pendingWorkloadContactId = snapshot.pendingWorkloadContactId();
        lastBonusInjectionMs = snapshot.lastBonusInjectionMs();
        bonusTasksInjectedToday = snapshot.bonusTasksInjectedToday();
        workIdleSinceMs = snapshot.workIdleSinceMs();
        sprintSyncAttendedToday = snapshot.sprintSyncAttendedToday();
    }

    private static ScenarioTag parseScenarioTag(String raw, String ticketId) {
        if (raw != null && !raw.isBlank()) {
            try {
                return ScenarioTag.valueOf(raw);
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        return ScenarioTag.inferFromTicketId(ticketId);
    }

    private TaskSnapshot toTaskSnapshot(InteractiveTask task) {
        return new TaskSnapshot(
                task.getId(),
                task.getTicketId(),
                task.getTitle(),
                task.getDescription(),
                task.getType().name(),
                task.getDurationHours(),
                task.getObjectives().stream()
                        .map(o -> new ObjectiveSnapshot(
                                o.getId(),
                                o.getType().name(),
                                o.getLabel(),
                                o.getContactId(),
                                o.getMessageId(),
                                o.getCorrectReplyId(),
                                o.isCompleted()
                        ))
                        .collect(Collectors.toList()),
                task.getCodeChallenge(),
                task.getReplyOptions(),
                task.getJiraStatus(),
                task.isTestsPassed(),
                task.isCompleted(),
                task.getPullRequestNumber(),
                task.getPullRequestStatus(),
                task.getReviewerContactId(),
                task.getScenarioTag().name()
        );
    }

    private InteractiveTask fromTaskSnapshot(TaskSnapshot snapshot) {
        List<TaskObjective> objectives = snapshot.objectives().stream()
                .map(o -> TaskObjective.restored(
                        o.id(),
                        ObjectiveType.valueOf(o.type()),
                        o.label(),
                        o.contactId(),
                        o.messageId(),
                        o.correctReplyId(),
                        o.completed()
                ))
                .collect(Collectors.toList());
        return new InteractiveTask(
                snapshot.id(),
                snapshot.ticketId(),
                snapshot.title(),
                snapshot.description(),
                TaskType.valueOf(snapshot.type()),
                parseScenarioTag(snapshot.scenarioTag(), snapshot.ticketId()),
                snapshot.durationHours(),
                objectives,
                snapshot.codeChallenge(),
                snapshot.replyOptions(),
                snapshot.jiraStatus(),
                snapshot.testsPassed(),
                snapshot.completed(),
                snapshot.pullRequestNumber() != null ? snapshot.pullRequestNumber() : 0,
                snapshot.pullRequestStatus(),
                snapshot.reviewerContactId()
        );
    }

    private MessageSnapshot toMessageSnapshot(ChatMessage message) {
        return new MessageSnapshot(
                message.getId(),
                message.getContactId(),
                message.getText(),
                message.isFromPlayer(),
                message.getTaskId(),
                message.isRead(),
                message.getTimestamp()
        );
    }

    private ChatMessage fromMessageSnapshot(MessageSnapshot snapshot) {
        return new ChatMessage(
                snapshot.id(),
                snapshot.contactId(),
                snapshot.text(),
                snapshot.fromPlayer(),
                snapshot.taskId(),
                snapshot.read(),
                snapshot.timestamp()
        );
    }

    private EmailSnapshot toEmailSnapshot(EmailMessage email) {
        return new EmailSnapshot(
                email.getId(),
                email.getFrom(),
                email.getSubject(),
                email.getBody(),
                email.getCategory(),
                email.getTaskId(),
                email.isRead()
        );
    }

    private EmailMessage fromEmailSnapshot(EmailSnapshot snapshot) {
        EmailMessage email = new EmailMessage(
                snapshot.id(),
                snapshot.from(),
                snapshot.subject(),
                snapshot.body(),
                snapshot.category(),
                snapshot.taskId()
        );
        email.setRead(snapshot.read());
        return email;
    }

    public record ActionResult(boolean success, String message, List<String> console) {
        public static ActionResult ok(String message) {
            return new ActionResult(true, message, null);
        }

        public static ActionResult ok(String message, List<String> console) {
            return new ActionResult(true, message, console);
        }

        public static ActionResult fail(String message) {
            return new ActionResult(false, message, null);
        }
    }
}
