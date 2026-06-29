package com.devsimulator.service;

import com.devsimulator.api.dto.AdminStatsDto;
import com.devsimulator.api.dto.AdminUserDto;
import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final AppUserRepository appUserRepository;
    private final GameServiceClient gameServiceClient;

    public AdminService(AppUserRepository appUserRepository, GameServiceClient gameServiceClient) {
        this.appUserRepository = appUserRepository;
        this.gameServiceClient = gameServiceClient;
    }

    public void requireAdmin() {
        if (!SecurityUtils.isAdmin()) {
            throw new IllegalArgumentException("Доступ только для администратора");
        }
    }

    public AdminStatsDto stats() {
        requireAdmin();
        long users = appUserRepository.count();
        long saves = gameServiceClient.countSaves();
        long admins = appUserRepository.findAll().stream().filter(AppUser::isAdmin).count();
        return new AdminStatsDto(users, saves, admins);
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> listUsers() {
        requireAdmin();
        Map<Long, String> summaries = gameServiceClient.saveSummaries();

        return appUserRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(user -> toAdminUserDto(user, summaries.get(user.getId())))
                .toList();
    }

    @Transactional
    public void deleteUser(Long userId) {
        requireAdmin();
        if (userId.equals(SecurityUtils.currentUserId())) {
            throw new IllegalArgumentException("Нельзя удалить текущего администратора");
        }
        gameServiceClient.deleteSave(userId);
        appUserRepository.deleteById(userId);
    }

    private AdminUserDto toAdminUserDto(AppUser user, String summary) {
        return new AdminUserDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.isAdmin(),
                summary != null,
                summary,
                user.getCreatedAt()
        );
    }
}
