package com.devsimulator.api;

import com.devsimulator.api.dto.ActionResponse;
import com.devsimulator.api.dto.CharacterCreateRequest;
import com.devsimulator.api.dto.CharacterOptionsDto;
import com.devsimulator.api.dto.CharacterValidationDto;
import com.devsimulator.api.dto.GameModeDto;
import com.devsimulator.api.dto.PortalNewsDto;
import com.devsimulator.api.dto.ProjectDto;
import com.devsimulator.api.dto.StartGameRequest;
import com.devsimulator.api.dto.TeamMemberDto;
import com.devsimulator.api.dto.WorkspaceDto;
import com.devsimulator.model.CharacterProfile;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.ProjectType;
import com.devsimulator.model.RestAction;
import com.devsimulator.service.CharacterValidator;
import com.devsimulator.service.GameSessionService;
import com.devsimulator.service.InteractiveGameEngine;
import com.devsimulator.service.ProjectCatalog;
import com.devsimulator.service.news.PortalNewsService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameSessionService sessionService;
    private final PortalNewsService portalNewsService;

    public GameController(GameSessionService sessionService, PortalNewsService portalNewsService) {
        this.sessionService = sessionService;
        this.portalNewsService = portalNewsService;
    }

    @GetMapping("/character/options")
    public CharacterOptionsDto characterOptions() {
        return CharacterOptionsDto.create();
    }

    @PostMapping("/character/validate")
    public CharacterValidationDto validateCharacter(@RequestBody CharacterCreateRequest request) {
        CharacterProfile profile = GameSessionService.toProfile(
                request.name(), request.age(), request.experienceYears(),
                request.education(), request.stackSkills());
        GameMode mode = request.mode() != null && !request.mode().isBlank()
                ? parseMode(request.mode()) : null;
        return CharacterValidationDto.from(CharacterValidator.validate(profile, mode));
    }

    @GetMapping("/projects")
    public ProjectDto[] projects() {
        return ProjectCatalog.all().stream().map(ProjectDto::from).toArray(ProjectDto[]::new);
    }

    @GetMapping("/team/preview")
    public TeamMemberDto[] previewTeam(@RequestParam String projectType, HttpSession session) {
        return sessionService.previewTeam(session, parseProject(projectType))
                .toArray(TeamMemberDto[]::new);
    }

    @GetMapping("/modes")
    public GameModeDto[] modes() {
        return Arrays.stream(GameMode.values()).map(GameModeDto::from).toArray(GameModeDto[]::new);
    }

    @PostMapping("/start")
    public ResponseEntity<ActionResponse> start(@RequestBody StartGameRequest request, HttpSession session) {
        GameMode mode = parseMode(request.mode());
        ProjectType project = parseProject(request.projectType());
        CharacterProfile character = GameSessionService.toProfile(
                request.playerName(), request.age(), request.experienceYears(),
                request.education(), request.stackSkills());
        CharacterValidator.ValidationResult validation = CharacterValidator.validate(character, mode);
        if (!validation.valid()) {
            WorkspaceDto empty = null;
            return ResponseEntity.ok(ActionResponse.fail(
                    String.join("\n", validation.errors()), empty));
        }
        InteractiveGameEngine engine = sessionService.startGame(session, mode, project, character, request.wallpaperIndex());
        WorkspaceDto ws = WorkspaceDto.from(engine);
        var profile = engine.getProjectProfile();
        var player = engine.getPlayer();
        return ResponseEntity.ok(ActionResponse.ok(
                "День 1 в " + profile.companyName() + ". "
                        + player.getCareerTitle() + " " + player.getName()
                        + ", " + player.getAge() + " лет. Откройте Slack!",
                ws
        ));
    }

    @GetMapping("/state")
    public ResponseEntity<WorkspaceDto> state(HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        WorkspaceDto ws = WorkspaceDto.from(engine);
        sessionService.persistEngine(session, engine);
        return ResponseEntity.ok(ws);
    }

    @GetMapping("/portal/news")
    public PortalNewsDto portalNews(
            @RequestParam(defaultValue = "ru") String lang,
            HttpSession session) {
        return portalNewsService.getNews(lang, requireEngine(session));
    }

    @PostMapping("/task/focus")
    public ResponseEntity<ActionResponse> focusTask(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        WorkspaceDto before = WorkspaceDto.from(engine);
        var result = engine.focusTask(body.get("taskId"));
        if (!result.success()) {
            return ResponseEntity.ok(ActionResponse.fail(result.message(), before));
        }
        sessionService.persistEngine(session, engine);
        return ResponseEntity.ok(ActionResponse.ok(result.message(), WorkspaceDto.from(engine)));
    }

    @PostMapping("/desk/arrive")
    public ResponseEntity<ActionResponse> arriveAtDesk(@RequestBody Map<String, Object> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        String type = String.valueOf(body.getOrDefault("type", "ON_TIME"));
        List<String> roomActions = new ArrayList<>();
        Object rawActions = body.get("roomActions");
        if (rawActions instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    roomActions.add(String.valueOf(item));
                }
            }
        }
        var result = engine.arriveAtDesk(type, roomActions);
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/meeting/complete")
    public ResponseEntity<ActionResponse> completeMeeting(@RequestBody Map<String, String> body,
                                                          HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.completeMeeting(body.get("meetingId"), body.get("responseId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/desk/leave")
    public ResponseEntity<ActionResponse> leaveDesk(HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.leaveDesk();
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/desk/late-reply")
    public ResponseEntity<ActionResponse> lateReply(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.respondToLateSms(body.get("replyType"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/messages/read")
    public ResponseEntity<ActionResponse> readMessage(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.readMessage(body.get("messageId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/messages/read-contact")
    public ResponseEntity<ActionResponse> readContactMessages(@RequestBody Map<String, String> body,
                                                              HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.readContactMessages(body.get("contactId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/messages/read-channel")
    public ResponseEntity<ActionResponse> readChannelMessages(HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.readChannelMessages();
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/messages/send")
    public ResponseEntity<ActionResponse> sendMessage(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.sendMessage(
                body.get("contactId"),
                body.getOrDefault("text", ""),
                body.get("replyOptionId")
        );
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/run")
    public ResponseEntity<ActionResponse> runTests(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.runTests(body.get("taskId"), body.getOrDefault("code", ""));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/submit")
    public ResponseEntity<ActionResponse> submitCode(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.submitCode(body.get("taskId"), body.getOrDefault("code", ""));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/push")
    public ResponseEntity<ActionResponse> pushCode(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.pushCode(body.get("taskId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/pr/create")
    public ResponseEntity<ActionResponse> createPullRequest(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.createPullRequest(body.get("taskId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/pr/request-review")
    public ResponseEntity<ActionResponse> requestPrReview(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.requestPrReview(body.get("taskId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/pr/check-review")
    public ResponseEntity<ActionResponse> checkPrReview(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.checkPrReview(body.get("taskId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/git/merge")
    public ResponseEntity<ActionResponse> mergeViaGit(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.mergePullRequest(body.get("taskId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/code/save")
    public ResponseEntity<ActionResponse> saveCode(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        engine.setEditorCode(body.get("taskId"), body.getOrDefault("code", ""));
        sessionService.persistEngine(session, engine);
        return ResponseEntity.ok(ActionResponse.ok("Сохранено", WorkspaceDto.from(engine)));
    }

    @PostMapping("/guided/complete")
    public ResponseEntity<ActionResponse> completeGuidedStep(@RequestBody Map<String, String> body,
                                                             HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.completeGuidedStep(body.get("taskId"), body.get("stepId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/jira/close")
    public ResponseEntity<ActionResponse> closeJira(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.closeJira(body.get("taskId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/jira/transition")
    public ResponseEntity<ActionResponse> jiraTransition(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        WorkspaceDto before = WorkspaceDto.from(engine);
        var result = engine.transitionJiraStatus(body.get("taskId"), body.get("status"));
        if (!result.success()) {
            return ResponseEntity.ok(ActionResponse.fail(result.message(), before));
        }
        sessionService.persistEngine(session, engine);
        return ResponseEntity.ok(ActionResponse.ok(result.message(), WorkspaceDto.from(engine)));
    }

    @PostMapping("/rest")
    public ResponseEntity<ActionResponse> rest(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        RestAction action;
        try {
            action = RestAction.valueOf(body.get("action"));
        } catch (Exception e) {
            return ResponseEntity.ok(ActionResponse.fail("Неизвестное действие", WorkspaceDto.from(engine)));
        }
        var result = engine.doRest(action, body.get("dialogueChoice"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/ops/action")
    public ResponseEntity<ActionResponse> opsAction(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.completeOpsAction(body.get("appId"), body.get("actionId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/email/read")
    public ResponseEntity<ActionResponse> readEmail(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.readEmail(body.get("emailId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/email/action")
    public ResponseEntity<ActionResponse> emailAction(@RequestBody Map<String, String> body, HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.handleEmailAction(body.get("emailId"), body.get("actionId"));
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    @PostMapping("/end-day")
    public ResponseEntity<ActionResponse> endDay(HttpSession session) {
        InteractiveGameEngine engine = requireEngine(session);
        var result = engine.endDay();
        return ResponseEntity.ok(toResponse(session, engine, result));
    }

    private ActionResponse toResponse(HttpSession session, InteractiveGameEngine engine,
                                      InteractiveGameEngine.ActionResult result) {
        sessionService.persistEngine(session, engine);
        WorkspaceDto ws = WorkspaceDto.from(engine);
        if (!result.success()) {
            return ActionResponse.fail(result.message(), ws);
        }
        if (result.console() != null) {
            return ActionResponse.ok(result.message(), ws, result.console());
        }
        return ActionResponse.ok(result.message(), ws);
    }

    private InteractiveGameEngine requireEngine(HttpSession session) {
        InteractiveGameEngine engine = sessionService.getEngine(session);
        if (engine == null) {
            throw new NoActiveGameException();
        }
        return engine;
    }

    private GameMode parseMode(String mode) {
        try {
            return GameMode.valueOf(mode);
        } catch (Exception e) {
            return GameMode.LEARNING;
        }
    }

    private ProjectType parseProject(String project) {
        try {
            return ProjectType.valueOf(project);
        } catch (Exception e) {
            return ProjectType.E_COMMERCE;
        }
    }
}
