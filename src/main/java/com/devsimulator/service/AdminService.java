package com.devsimulator.service;

import com.devsimulator.api.dto.AdminStatsDto;
import com.devsimulator.api.dto.AdminUserDto;
import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.entity.GameSave;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.persistence.repository.GameSaveRepository;
import com.devsimulator.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final AppUserRepository appUserRepository;
    private final GameSaveRepository gameSaveRepository;

    public AdminService(AppUserRepository appUserRepository, GameSaveRepository gameSaveRepository) {
        this.appUserRepository = appUserRepository;
        this.gameSaveRepository = gameSaveRepository;
    }

    public void requireAdmin() {
        if (!SecurityUtils.isAdmin()) {
            throw new IllegalArgumentException("Доступ только для администратора");
        }
    }

    public AdminStatsDto stats() {
        requireAdmin();
        long users = appUserRepository.count();
        long saves = gameSaveRepository.count();
        long admins = appUserRepository.findAll().stream().filter(AppUser::isAdmin).count();
        return new AdminStatsDto(users, saves, admins);
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> listUsers() {
        requireAdmin();
        Map<Long, GameSave> savesByUserId = gameSaveRepository.findAll().stream()
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (a, b) -> a));

        return appUserRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(user -> toAdminUserDto(user, savesByUserId.get(user.getId())))
                .toList();
    }

    @Transactional
    public void deleteUser(Long userId) {
        requireAdmin();
        if (userId.equals(SecurityUtils.currentUserId())) {
            throw new IllegalArgumentException("Нельзя удалить текущего администратора");
        }
        gameSaveRepository.findByUserId(userId).ifPresent(gameSaveRepository::delete);
        appUserRepository.deleteById(userId);
    }

    private AdminUserDto toAdminUserDto(AppUser user, GameSave save) {
        String summary = null;
        if (save != null) {
            summary = save.getPlayerName() + " · день " + save.getGameDay()
                    + (save.getCompanyName() != null ? " · " + save.getCompanyName() : "");
        }
        return new AdminUserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.isAdmin(),
                save != null,
                summary,
                user.getCreatedAt()
        );
    }
}
