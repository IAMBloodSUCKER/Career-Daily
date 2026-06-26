package com.devsimulator.service;

import com.devsimulator.api.dto.AuthUserDto;
import com.devsimulator.api.dto.LoginRequest;
import com.devsimulator.api.dto.RegisterRequest;
import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.security.AppUserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthUserDto register(RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email уже зарегистрирован");
        }
        if (appUserRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("Имя пользователя занято");
        }
        AppUser user = new AppUser(
                request.email().trim().toLowerCase(),
                request.username().trim(),
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                false
        );
        user = appUserRepository.save(user);
        return toDto(user);
    }

    public AuthUserDto toDto(AppUser user) {
        return new AuthUserDto(user.getId(), user.getUsername(), user.getEmail(), user.getDisplayName(), user.isAdmin());
    }

    public AuthUserDto toDto(AppUserPrincipal principal) {
        return new AuthUserDto(
                principal.getId(),
                principal.getUsername(),
                principal.getEmail(),
                principal.getDisplayName(),
                principal.isAdmin()
        );
    }

    public static String normalizeLogin(LoginRequest request) {
        return request.login().trim();
    }
}
