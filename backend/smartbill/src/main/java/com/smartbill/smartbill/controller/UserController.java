package com.smartbill.smartbill.controller;

import com.smartbill.smartbill.model.LoginHistory;
import com.smartbill.smartbill.model.User;
import com.smartbill.smartbill.repository.LoginHistoryRepository;
import com.smartbill.smartbill.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class UserController {

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public UserController(
            UserRepository userRepository,
            LoginHistoryRepository loginHistoryRepository) {

        this.userRepository = userRepository;
        this.loginHistoryRepository = loginHistoryRepository;
    }

    // =========================
    // REGISTER
    // =========================

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Email already registered");
        }

        if (userRepository.findByMobile(user.getMobile()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Mobile number already registered");
        }

        String hashedPassword =
                passwordEncoder.encode(user.getPassword());

        user.setPassword(hashedPassword);

        userRepository.save(user);

        return ResponseEntity.ok(
                "User registered successfully"
        );
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginUser) {

        Optional<User> user = Optional.empty();

        String loginMethod;

        // Login using EMAIL
        if (loginUser.getEmail() != null &&
                !loginUser.getEmail().isBlank()) {

            user = userRepository.findByEmail(
                    loginUser.getEmail()
            );

            loginMethod = "EMAIL";

        } else {

            // Login using MOBILE
            user = userRepository.findByMobile(
                    loginUser.getMobile()
            );

            loginMethod = "MOBILE";
        }

        // User not found
        if (user.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("User not found");
        }

        // Check password
        boolean passwordMatches =
                passwordEncoder.matches(
                        loginUser.getPassword(),
                        user.get().getPassword()
                );

        if (!passwordMatches) {
            return ResponseEntity.badRequest()
                    .body("Invalid password");
        }

        // Save login history
        LoginHistory history = new LoginHistory();

        history.setUserId(user.get().getId());

        history.setLoginTime(
                LocalDateTime.now()
        );

        history.setLoginMethod(loginMethod);

        loginHistoryRepository.save(history);

        // Login successful
        return ResponseEntity.ok(
                user.get()
        );
    }

    // =========================
    // LOGOUT
    // =========================

    @PostMapping("/logout/{userId}")
    public ResponseEntity<?> logout(
            @PathVariable Long userId) {

        Optional<LoginHistory> history =
                loginHistoryRepository.findAll()
                        .stream()
                        .filter(h ->
                                h.getUserId().equals(userId)
                                &&
                                h.getLogoutTime() == null
                        )
                        .reduce(
                                (first, second) -> second
                        );

        if (history.isPresent()) {

            LoginHistory loginHistory =
                    history.get();

            loginHistory.setLogoutTime(
                    LocalDateTime.now()
            );

            loginHistoryRepository.save(
                    loginHistory
            );

            return ResponseEntity.ok(
                    "Logged out successfully"
            );
        }

        return ResponseEntity.ok(
                "Logout recorded"
        );
    }

    // =========================
    // LOGIN HISTORY
    // =========================

    @GetMapping("/login-history/{userId}")
    public ResponseEntity<?> getLoginHistory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                loginHistoryRepository
                        .findByUserIdOrderByLoginTimeDesc(
                                userId
                        )
        );
    }

    // =========================
    // FIND USER BY EMAIL
    // =========================

    @GetMapping("/by-email")
    public ResponseEntity<?> getUserByEmail(
            @RequestParam String email) {

        Optional<User> user =
                userRepository.findByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("User not found");
        }

        return ResponseEntity.ok(
                user.get()
        );
    }

    // =========================
    // FIND USER BY MOBILE
    // =========================

    @GetMapping("/by-mobile")
    public ResponseEntity<?> getUserByMobile(
            @RequestParam String mobile) {

        Optional<User> user =
                userRepository.findByMobile(mobile);

        if (user.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("User not found");
        }

        return ResponseEntity.ok(
                user.get()
        );
    }
}