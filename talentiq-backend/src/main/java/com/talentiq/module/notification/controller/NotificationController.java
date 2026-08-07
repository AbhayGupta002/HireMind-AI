package com.talentiq.module.notification.controller;

import com.talentiq.common.response.ApiResponse;
import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.notification.dto.NotificationDto;
import com.talentiq.module.notification.service.NotificationService;
import com.talentiq.security.userdetails.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications, badge counters, and email alert settings")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Send a notification alert to a user (Admin only)")
    public ResponseEntity<ApiResponse<NotificationDto.Response>> sendNotification(
            @RequestParam Long recipientUserId,
            @Valid @RequestBody NotificationDto.SendRequest request) {
        NotificationDto.Response response = notificationService.sendNotification(recipientUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Notification sent successfully", response));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List current user's notifications")
    public ResponseEntity<PagedResponse<NotificationDto.Response>> listMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.listUserNotifications(principal.getId(), pageable));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread notification count badge")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        notificationService.markAsRead(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user's notification preferences")
    public ResponseEntity<ApiResponse<NotificationDto.PreferencesResponse>> getPreferences(
            @AuthenticationPrincipal UserPrincipal principal) {
        NotificationDto.PreferencesResponse preferences = notificationService.getPreferences(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(preferences));
    }

    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update current user's notification preferences")
    public ResponseEntity<ApiResponse<NotificationDto.PreferencesResponse>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody NotificationDto.PreferencesUpdateRequest request) {
        NotificationDto.PreferencesResponse preferences = notificationService.updatePreferences(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated", preferences));
    }
}
