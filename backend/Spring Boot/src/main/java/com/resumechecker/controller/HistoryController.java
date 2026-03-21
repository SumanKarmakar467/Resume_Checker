// Purpose: Provide authenticated access to resume analysis history.
package com.resumechecker.controller;

import com.resumechecker.model.ResumeHistory;
import com.resumechecker.model.User;
import com.resumechecker.repository.HistoryRepository;
import com.resumechecker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class HistoryController {
    private final HistoryRepository historyRepository;
    private final UserRepository userRepository;

    public HistoryController(HistoryRepository historyRepository, UserRepository userRepository) {
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getHistory(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized."));
        }

        Optional<User> user = userRepository.findByEmail(authentication.getName());
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized."));
        }

        List<ResumeHistory> history = historyRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.get().getId());
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable String id, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized."));
        }

        Optional<User> user = userRepository.findByEmail(authentication.getName());
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized."));
        }

        Optional<ResumeHistory> entry = historyRepository.findById(id);
        if (entry.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "History entry not found."));
        }

        if (!user.get().getId().equals(entry.get().getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Forbidden."));
        }

        historyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "History entry deleted."));
    }
}
