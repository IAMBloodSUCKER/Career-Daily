package com.devsimulator.api;

import com.devsimulator.api.dto.AdminStatsDto;
import com.devsimulator.api.dto.AdminUserDto;
import com.devsimulator.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    public List<AdminUserDto> users() {
        return adminService.listUsers();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
