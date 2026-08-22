package com.talentiq.controller.admin;

import com.talentiq.common.response.ApiResponse;
import com.talentiq.common.response.PagedResponse;
import com.talentiq.dto.admin.AdminDto;
import com.talentiq.service.admin.AdminService;
import com.talentiq.dto.company.CompanyDto;
import com.talentiq.dto.user.UserDto;
import com.talentiq.security.userdetails.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Admin Management", description = "Platform administration, user lockout controls, and company verification workflows")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "List all platform users with search filters (Admin only)")
    public ResponseEntity<PagedResponse<UserDto.Response>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.listUsers(search, enabled, pageable));
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Lock or unlock a user account (Admin only)")
    public ResponseEntity<ApiResponse<UserDto.Response>> setUserStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AdminDto.UserStatusRequest request) {
        UserDto.Response response = adminService.setUserEnabledStatus(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", response));
    }

    @GetMapping("/companies/pending")
    @Operation(summary = "List companies pending verification (Admin only)")
    public ResponseEntity<PagedResponse<CompanyDto.Response>> listPendingCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.listPendingCompanies(pageable));
    }

    @PutMapping("/companies/{id}/verify")
    @Operation(summary = "Verify or reject a corporate registration (Admin only)")
    public ResponseEntity<ApiResponse<CompanyDto.Response>> verifyCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AdminDto.CompanyVerificationRequest request) {
        CompanyDto.Response response = adminService.verifyCompany(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Company verification updated", response));
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get platform-wide system operational metrics (Admin only)")
    public ResponseEntity<ApiResponse<AdminDto.SystemMetricsResponse>> getSystemMetrics(
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminDto.SystemMetricsResponse metrics = adminService.getSystemMetrics(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
}
