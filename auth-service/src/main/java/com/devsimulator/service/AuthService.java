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
        if (!Boolean.TRUE.equals(request.personalDataConsent())) {
            throw new IllegalArgumentException("Необходимо согласие на обработку персональных данных (152-ФЗ)");
        }

        String phone = RussianRegistrationPolicy.normalizePhone(request.phone());
        String email = RussianRegistrationPolicy.normalizeEmail(request.email());
        RussianRegistrationPolicy.requireRussianEmail(email);

        if (appUserRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Этот номер телефона уже зарегистрирован");
        }
        if (email != null && appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email уже зарегистрирован");
        }
        if (appUserRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("Имя пользователя занято");
        }

        AppUser user = new AppUser(
                email,
                phone,
                request.username().trim(),
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                false
        );
        user = appUserRepository.save(user);
        return toDto(user);
    }

    public AuthUserDto toDto(AppUser user) {
        return new AuthUserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getDisplayName(),
                user.isAdmin()
        );
    }

    public AuthUserDto toDto(AppUserPrincipal principal) {
        return new AuthUserDto(
                principal.getId(),
                principal.getUsername(),
                principal.getEmail(),
                principal.getPhone(),
                principal.getDisplayName(),
                principal.isAdmin()
        );
    }

    public static String normalizeLogin(LoginRequest request) {
        String login = request.login().trim();
        if (RussianRegistrationPolicy.looksLikePhone(login)) {
            return RussianRegistrationPolicy.normalizePhone(login);
        }
        return login;
    }
}
