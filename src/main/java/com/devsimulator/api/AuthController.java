package com.devsimulator.api;

import com.devsimulator.api.dto.AuthSetupDto;
import com.devsimulator.api.dto.AuthUserDto;
import com.devsimulator.api.dto.LoginRequest;
import com.devsimulator.api.dto.RegisterRequest;
import com.devsimulator.config.AdminProperties;
import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.security.AppUserPrincipal;
import com.devsimulator.security.SecurityUtils;
import com.devsimulator.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final AdminProperties adminProperties;
    private final AppUserRepository appUserRepository;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(AuthService authService,
                          AuthenticationManager authenticationManager,
                          AdminProperties adminProperties,
                          AppUserRepository appUserRepository,
                          SecurityContextRepository securityContextRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.adminProperties = adminProperties;
        this.appUserRepository = appUserRepository;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping("/setup")
    public AuthSetupDto setup() {
        if (!adminProperties.isDevLoginEnabled()) {
            return new AuthSetupDto(false, null, null);
        }
        return new AuthSetupDto(
                true,
                adminProperties.getUsername(),
                "Быстрый вход без регистрации (только dev)"
        );
    }

    @PostMapping("/dev-login")
    public ResponseEntity<AuthUserDto> devLogin(HttpServletRequest httpRequest,
                                              HttpServletResponse httpResponse) {
        if (!adminProperties.isDevLoginEnabled()) {
            throw new IllegalArgumentException("Dev login отключён");
        }
        AppUser admin = appUserRepository.findByUsernameIgnoreCase(adminProperties.getUsername().trim())
                .filter(AppUser::isAdmin)
                .orElseThrow(() -> new IllegalStateException("Admin не найден — перезапустите приложение"));
        AppUserPrincipal principal = new AppUserPrincipal(admin);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
        establishSession(authentication, httpRequest, httpResponse);
        return ResponseEntity.ok(authService.toDto(principal));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthUserDto> register(@Valid @RequestBody RegisterRequest request,
                                                HttpServletRequest httpRequest,
                                                HttpServletResponse httpResponse) {
        authService.register(request);
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username().trim(), request.password())
        );
        establishSession(authentication, httpRequest, httpResponse);
        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(authService.toDto(principal));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUserDto> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletRequest httpRequest,
                                             HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        AuthService.normalizeLogin(request),
                        request.password()
                )
        );
        establishSession(authentication, httpRequest, httpResponse);
        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(authService.toDto(principal));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDto> me() {
        if (!SecurityUtils.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        AppUserPrincipal principal = (AppUserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.ok(authService.toDto(principal));
    }

    private void establishSession(Authentication authentication,
                                HttpServletRequest httpRequest,
                                HttpServletResponse httpResponse) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
    }
}
