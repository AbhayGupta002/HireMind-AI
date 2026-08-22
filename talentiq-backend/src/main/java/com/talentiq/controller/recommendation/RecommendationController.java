package com.talentiq.controller.recommendation;

import com.talentiq.common.response.ApiResponse;
import com.talentiq.common.response.PagedResponse;
import com.talentiq.dto.recommendation.RecommendationDto;
import com.talentiq.service.recommendation.RecommendationService;
import com.talentiq.security.userdetails.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "AI Recommendation Engine", description = "Job matching recommendations for candidates and HR recruiters")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/jobs")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get personalized job recommendations (Candidate only)")
    public ResponseEntity<PagedResponse<RecommendationDto>> getJobRecommendations(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<RecommendationDto> response = recommendationService.getJobRecommendationsForCandidate(principal.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidates/{jobId}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Get matching candidate recommendations for a job (HR only)")
    public ResponseEntity<PagedResponse<RecommendationDto>> getCandidateRecommendations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<RecommendationDto> response = recommendationService.getCandidateRecommendationsForJob(principal.getId(), jobId, pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/match")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Force recalculate match score between a candidate and a job")
    public ResponseEntity<ApiResponse<RecommendationDto>> computeMatchScore(
            @RequestParam Long candidateId,
            @RequestParam Long jobId) {
        RecommendationDto response = recommendationService.computeRecommendationMatch(candidateId, jobId);
        return ResponseEntity.ok(ApiResponse.success("Match score calculated successfully", response));
    }
}
