package com.devsimulator.api.dto;

import java.util.List;

public record ActionResponse(
        boolean success,
        String message,
        WorkspaceDto workspace,
        List<String> console
) {
    public static ActionResponse ok(String message, WorkspaceDto workspace) {
        return new ActionResponse(true, message, workspace, workspace != null ? workspace.console() : null);
    }

    public static ActionResponse ok(String message, WorkspaceDto workspace, List<String> console) {
        return new ActionResponse(true, message, workspace, console);
    }

    public static ActionResponse fail(String message, WorkspaceDto workspace) {
        return new ActionResponse(false, message, workspace, null);
    }
}
