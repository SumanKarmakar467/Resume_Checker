// Purpose: Handle user registration and login with JWT issuance.
package com.resumechecker.controller;

import com.resumechecker.model.User;
import com.resumechecker.repository.UserRepository;
import com.resumechecker.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String password = request.password() == null ? "" : request.password().trim();

        if (email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered."));
        }

        User user = new User(null, email, passwordEncoder.encode(password), Instant.now());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Registration successful."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = normalizeEmail(request.email());
        String password = request.password() == null ? "" : request.password().trim();

        if (email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty() || !passwordEncoder.matches(password, user.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials."));
        }

        String token = jwtUtil.generateToken(user.get().getEmail());
        return ResponseEntity.ok(new AuthResponse(token));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private record RegisterRequest(String email, String password) {
    }

    private record LoginRequest(String email, String password) {
    }

    private record AuthResponse(String token) {
    }
}
