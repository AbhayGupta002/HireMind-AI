package com.talentiq.module.application.controller;

import com.talentiq.common.response.ApiResponse;
import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.application.dto.JobApplicationDto;
import com.talentiq.module.application.service.JobApplicationService;
import com.talentiq.security.userdetails.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Job Applications", description = "Job application workflows, status transitions, and histories tracking")
public class JobApplicationController {

    private final JobApplicationService applicationService;

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Apply for a job posting (Candidate only)")
    public ResponseEntity<ApiResponse<JobApplicationDto.Response>> applyForJob(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody JobApplicationDto.ApplyRequest request) {
        JobApplicationDto.Response response = applicationService.applyForJob(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Application submitted successfully", response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Update job application status stage (HR recruiters only)")
    public ResponseEntity<ApiResponse<JobApplicationDto.Response>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody JobApplicationDto.StatusUpdateRequest request) {
        JobApplicationDto.Response response = applicationService.updateApplicationStatus(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Application status updated", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get application details and status audit history timeline")
    public ResponseEntity<ApiResponse<JobApplicationDto.Response>> getApplicationDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        JobApplicationDto.Response response = applicationService.getApplicationDetails(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "List all applications submitted to a job posting (HR only)")
    public ResponseEntity<PagedResponse<JobApplicationDto.Response>> getJobApplications(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        return ResponseEntity.ok(applicationService.getApplicationsForJob(principal.getId(), jobId, pageable));
    }

    @GetMapping("/hr")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "List all applications submitted to HR company jobs (HR only)")
    public ResponseEntity<PagedResponse<JobApplicationDto.Response>> getHrCompanyApplications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        return ResponseEntity.ok(applicationService.getApplicationsForHrCompany(principal.getId(), pageable));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "List candidate's own job applications")
    public ResponseEntity<PagedResponse<JobApplicationDto.Response>> getMyApplications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        return ResponseEntity.ok(applicationService.getCandidateApplications(principal.getId(), pageable));
    }
}
