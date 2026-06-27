package com.devsimulator.model;

public class DayRecord {
    private int tasksCompleted;
    private int tasksSkipped;
    private int restActions;
    private int leisureActions;
    private int workHoursSpent;
    private int warningsIssuedToday;

    public void recordTaskCompleted(int hours) {
        tasksCompleted++;
        workHoursSpent += hours;
    }

    public void recordTaskSkipped() {
        tasksSkipped++;
    }

    public void recordRest(RestAction action) {
        restActions++;
        if (action == RestAction.SLEEP || action == RestAction.FRIENDS || action == RestAction.GYM) {
            leisureActions++;
        }
    }

    public int getTasksCompleted() {
        return tasksCompleted;
    }

    public int getTasksSkipped() {
        return tasksSkipped;
    }

    public int getRestActions() {
        return restActions;
    }

    public int getLeisureActions() {
        return leisureActions;
    }

    public int getWorkHoursSpent() {
        return workHoursSpent;
    }

    public boolean didNoWork() {
        return tasksCompleted == 0;
    }

    public boolean slackedAllDay() {
        return tasksCompleted == 0 && leisureActions > 0;
    }

    public boolean canIssueWarning(int maxPerDay) {
        return warningsIssuedToday < maxPerDay;
    }

    public void recordWarningIssued() {
        warningsIssuedToday++;
    }

    public int getWarningsIssuedToday() {
        return warningsIssuedToday;
    }

    public void reset() {
        tasksCompleted = 0;
        tasksSkipped = 0;
        restActions = 0;
        leisureActions = 0;
        workHoursSpent = 0;
        warningsIssuedToday = 0;
    }

    public void restoreState(int tasksCompleted, int tasksSkipped, int restActions,
                             int leisureActions, int workHoursSpent) {
        this.tasksCompleted = tasksCompleted;
        this.tasksSkipped = tasksSkipped;
        this.restActions = restActions;
        this.leisureActions = leisureActions;
        this.workHoursSpent = workHoursSpent;
        this.warningsIssuedToday = 0;
    }
}
