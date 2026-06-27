package com.devsimulator.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InteractiveTask {
    private final String id;
    private final String ticketId;
    private final String title;
    private final String description;
    private final TaskType type;
    private final ScenarioTag scenarioTag;
    private final int durationHours;
    private final List<TaskObjective> objectives;
    private final CodeChallenge codeChallenge;
    private final List<ReplyOption> replyOptions;
    private String jiraStatus;
    private boolean testsPassed;
    private boolean completed;
    private int pullRequestNumber;
    private String pullRequestStatus = "NONE";
    private String reviewerContactId;

    public InteractiveTask(String ticketId, String title, String description, TaskType type,
                           int durationHours, List<TaskObjective> objectives,
                           CodeChallenge codeChallenge, List<ReplyOption> replyOptions) {
        this(ticketId, title, description, type, ScenarioTag.GENERIC, durationHours,
                objectives, codeChallenge, replyOptions);
    }

    public InteractiveTask(String ticketId, String title, String description, TaskType type,
                           ScenarioTag scenarioTag, int durationHours, List<TaskObjective> objectives,
                           CodeChallenge codeChallenge, List<ReplyOption> replyOptions) {
        this.id = UUID.randomUUID().toString();
        this.ticketId = ticketId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.scenarioTag = scenarioTag != null ? scenarioTag : ScenarioTag.GENERIC;
        this.durationHours = durationHours;
        this.objectives = new ArrayList<>(objectives);
        this.codeChallenge = codeChallenge;
        this.replyOptions = replyOptions != null ? replyOptions : List.of();
        this.jiraStatus = "TO DO";
        this.testsPassed = false;
        this.completed = false;
    }

    public InteractiveTask(String id, String ticketId, String title, String description, TaskType type,
                           int durationHours, List<TaskObjective> objectives,
                           CodeChallenge codeChallenge, List<ReplyOption> replyOptions,
                           String jiraStatus, boolean testsPassed, boolean completed) {
        this(id, ticketId, title, description, type, ScenarioTag.GENERIC, durationHours, objectives,
                codeChallenge, replyOptions, jiraStatus, testsPassed, completed, 0, "NONE", null);
    }

    public InteractiveTask(String id, String ticketId, String title, String description, TaskType type,
                           ScenarioTag scenarioTag, int durationHours, List<TaskObjective> objectives,
                           CodeChallenge codeChallenge, List<ReplyOption> replyOptions,
                           String jiraStatus, boolean testsPassed, boolean completed,
                           int pullRequestNumber, String pullRequestStatus, String reviewerContactId) {
        this.id = id;
        this.ticketId = ticketId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.scenarioTag = scenarioTag != null ? scenarioTag : ScenarioTag.GENERIC;
        this.durationHours = durationHours;
        this.objectives = new ArrayList<>(objectives);
        this.codeChallenge = codeChallenge;
        this.replyOptions = replyOptions != null ? replyOptions : List.of();
        this.jiraStatus = jiraStatus;
        this.testsPassed = testsPassed;
        this.completed = completed;
        this.pullRequestNumber = pullRequestNumber;
        this.pullRequestStatus = pullRequestStatus != null ? pullRequestStatus : "NONE";
        this.reviewerContactId = reviewerContactId;
    }

    public String getId() {
        return id;
    }

    public String getTicketId() {
        return ticketId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public TaskType getType() {
        return type;
    }

    public ScenarioTag getScenarioTag() {
        return scenarioTag;
    }

    public int getDurationHours() {
        return durationHours;
    }

    public List<TaskObjective> getObjectives() {
        return objectives;
    }

    public CodeChallenge getCodeChallenge() {
        return codeChallenge;
    }

    public List<ReplyOption> getReplyOptions() {
        return replyOptions;
    }

    public String getJiraStatus() {
        return jiraStatus;
    }

    public void setJiraStatus(String jiraStatus) {
        this.jiraStatus = jiraStatus;
    }

    public boolean isTestsPassed() {
        return testsPassed;
    }

    public void setTestsPassed(boolean testsPassed) {
        this.testsPassed = testsPassed;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public int getPullRequestNumber() {
        return pullRequestNumber;
    }

    public void setPullRequestNumber(int pullRequestNumber) {
        this.pullRequestNumber = pullRequestNumber;
    }

    public String getPullRequestStatus() {
        return pullRequestStatus;
    }

    public void setPullRequestStatus(String pullRequestStatus) {
        this.pullRequestStatus = pullRequestStatus;
    }

    public String getReviewerContactId() {
        return reviewerContactId;
    }

    public void setReviewerContactId(String reviewerContactId) {
        this.reviewerContactId = reviewerContactId;
    }

    public boolean allObjectivesDone() {
        return objectives.stream().allMatch(TaskObjective::isCompleted);
    }

    public TaskObjective findObjective(ObjectiveType type) {
        return objectives.stream()
                .filter(o -> o.getType() == type && !o.isCompleted())
                .findFirst()
                .orElse(null);
    }

    public TaskObjective findObjective(String objectiveId) {
        return objectives.stream()
                .filter(o -> o.getId().equals(objectiveId))
                .findFirst()
                .orElse(null);
    }
}
