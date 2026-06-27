package com.devsimulator.api.dto;

import java.util.List;

public record WorkspaceResponse(
        boolean success,
        String message,
        WorkspaceDto workspace,
        List<String> console
) {
    public static WorkspaceResponse ok(String message, WorkspaceDto workspace) {
        return new WorkspaceResponse(true, message, workspace, workspace != null ? workspace.console() : null);
    }

    public static WorkspaceResponse ok(String message, WorkspaceDto workspace, List<String> console) {
        return new WorkspaceResponse(true, message, workspace, console);
    }

    public static WorkspaceResponse fail(String message, WorkspaceDto workspace) {
        return new WorkspaceResponse(false, message, workspace, null);
    }
}
