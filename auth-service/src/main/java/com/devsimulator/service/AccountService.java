package com.devsimulator.service;

import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.security.SecurityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final AppUserRepository appUserRepository;
    private final GameServiceClient gameServiceClient;
    private final PasswordEncoder passwordEncoder;

    public AccountService(AppUserRepository appUserRepository,
                          GameServiceClient gameServiceClient,
                          PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.gameServiceClient = gameServiceClient;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void deleteOwnAccount(String password) {
        Long userId = SecurityUtils.currentUserId();
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Неверный пароль");
        }
        if (user.isAdmin()) {
            throw new IllegalArgumentException(
                    "Администраторский аккаунт может удалить только другой администратор");
        }

        gameServiceClient.deleteSave(userId);
        appUserRepository.delete(user);
    }
}
