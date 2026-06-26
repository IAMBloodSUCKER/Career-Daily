package com.devsimulator.service;

import com.devsimulator.model.CharacterProfile;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.Player;
import com.devsimulator.api.dto.TeamMemberDto;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.ProjectType;
import com.devsimulator.model.TeamMemberIntro;
import com.devsimulator.persistence.GameStateSerializer;
import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.entity.GameSave;
import com.devsimulator.persistence.repository.GameSaveRepository;
import com.devsimulator.persistence.snapshot.GameEngineSnapshot;
import com.devsimulator.security.CurrentUserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GameSessionService {

    private static final String SESSION_KEY = "engine";
    private static final String TEAM_PREVIEW_KEY = "teamPreview";
    private static final String TEAM_PREVIEW_PROJECT_KEY = "teamPreviewProject";

    private final GameSaveRepository gameSaveRepository;
    private final GameStateSerializer gameStateSerializer;
    private final CurrentUserService currentUserService;

    public GameSessionService(GameSaveRepository gameSaveRepository,
                              GameStateSerializer gameStateSerializer,
                              CurrentUserService currentUserService) {
        this.gameSaveRepository = gameSaveRepository;
        this.gameStateSerializer = gameStateSerializer;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public InteractiveGameEngine startGame(HttpSession session, GameMode mode, ProjectType projectType,
                                           CharacterProfile character, Integer wallpaperIndex) {
        CharacterValidator.ValidationResult validation = CharacterValidator.validate(character);
        if (!validation.valid()) {
            throw new IllegalArgumentException(String.join(" ", validation.errors()));
        }
        CharacterValidator.PlayerStats stats = CharacterValidator.fromValidation(character, validation);
        List<TeamMemberIntro> team = resolveTeam(session, projectType);
        session.removeAttribute(TEAM_PREVIEW_KEY);
        session.removeAttribute(TEAM_PREVIEW_PROJECT_KEY);
        InteractiveGameEngine engine = new InteractiveGameEngine(new Player(stats), mode, projectType, team);
        int idx = wallpaperIndex != null
                ? wallpaperIndex
                : Math.floorMod(character.name().hashCode(), 10);
        engine.setWallpaperIndex(idx);
        session.setAttribute(SESSION_KEY, engine);
        persistEngine(session, engine);
        return engine;
    }

    public InteractiveGameEngine getEngine(HttpSession session) {
        Object value = session.getAttribute(SESSION_KEY);
        if (value instanceof InteractiveGameEngine engine) {
            return engine;
        }
        AppUser user = currentUserService.requireCurrentUser();
        return gameSaveRepository.findByUser(user)
                .map(save -> {
                    GameEngineSnapshot snapshot = gameStateSerializer.fromJson(save.getStateJson());
                    InteractiveGameEngine engine = InteractiveGameEngine.fromSnapshot(snapshot);
                    session.setAttribute(SESSION_KEY, engine);
                    return engine;
                })
                .orElse(null);
    }

    @Transactional
    public void persistEngine(HttpSession session, InteractiveGameEngine engine) {
        session.setAttribute(SESSION_KEY, engine);
        AppUser user = currentUserService.requireCurrentUser();
        GameEngineSnapshot snapshot = engine.captureSnapshot();
        String json = gameStateSerializer.toJson(snapshot);

        GameSave save = gameSaveRepository.findByUser(user).orElseGet(() -> new GameSave(user, json));
        save.setStateJson(json);
        save.setPlayerName(engine.getPlayer().getName());
        save.setCareerTitle(engine.getPlayer().getCareerTitle());
        save.setCompanyName(engine.getProjectProfile().companyName());
        save.setGameDay(engine.getPlayer().getDay());
        save.setGameMode(engine.getMode().name());
        save.setProjectType(engine.getProjectProfile().type().name());
        save.setGameOver(engine.isGameOver());
        gameSaveRepository.save(save);
    }

    public List<TeamMemberDto> previewTeam(HttpSession session, ProjectType projectType) {
        ProjectProfile base = ProjectCatalog.get(projectType);
        List<TeamMemberIntro> team = TeamGenerator.randomizeTeam(base, new java.util.Random());
        session.setAttribute(TEAM_PREVIEW_KEY, team);
        session.setAttribute(TEAM_PREVIEW_PROJECT_KEY, projectType.name());
        return team.stream().map(TeamMemberDto::from).toList();
    }

    @SuppressWarnings("unchecked")
    private List<TeamMemberIntro> resolveTeam(HttpSession session, ProjectType projectType) {
        Object cached = session.getAttribute(TEAM_PREVIEW_KEY);
        Object cachedProject = session.getAttribute(TEAM_PREVIEW_PROJECT_KEY);
        if (cached instanceof List<?> list && !list.isEmpty()
                && projectType.name().equals(cachedProject)
                && list.get(0) instanceof TeamMemberIntro) {
            return (List<TeamMemberIntro>) cached;
        }
        return TeamGenerator.randomizeTeam(ProjectCatalog.get(projectType), new java.util.Random());
    }

    public static CharacterProfile toProfile(String name, int age, int experienceYears,
                                             String education, java.util.List<String> stackSkills) {
        com.devsimulator.model.EducationLevel edu;
        try {
            edu = com.devsimulator.model.EducationLevel.valueOf(education);
        } catch (Exception e) {
            edu = com.devsimulator.model.EducationLevel.STUDENT;
        }
        return new CharacterProfile(name, age, experienceYears, edu, stackSkills);
    }
}
