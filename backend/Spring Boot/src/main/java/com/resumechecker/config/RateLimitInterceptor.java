// Purpose: Enforce per-IP rate limiting for resume analyze endpoint.
package com.resumechecker.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_MILLIS = Duration.ofHours(1).toMillis();
    private static final String ERROR_JSON = "{\"error\":\"Rate limit exceeded. Max 10 analyze requests per hour.\"}";
    private final Map<String, Deque<Long>> requestLogByIp = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        long now = System.currentTimeMillis();
        String ipAddress = extractClientIp(request);
        Deque<Long> requestTimes = requestLogByIp.computeIfAbsent(ipAddress, key -> new ArrayDeque<>());

        synchronized (requestTimes) {
            while (!requestTimes.isEmpty() && now - requestTimes.peekFirst() > WINDOW_MILLIS) {
                requestTimes.pollFirst();
            }

            if (requestTimes.size() >= MAX_REQUESTS) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(ERROR_JSON);
                return false;
            }

            requestTimes.addLast(now);
        }

        return true;
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int commaIndex = forwardedFor.indexOf(',');
            return commaIndex >= 0 ? forwardedFor.substring(0, commaIndex).trim() : forwardedFor.trim();
        }
        return request.getRemoteAddr();
    }
}
