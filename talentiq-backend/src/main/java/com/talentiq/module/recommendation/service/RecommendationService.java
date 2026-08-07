package com.talentiq.module.recommendation.service;

import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.recommendation.dto.RecommendationDto;
import org.springframework.data.domain.Pageable;

public interface RecommendationService {

    PagedResponse<RecommendationDto> getJobRecommendationsForCandidate(Long userId, Pageable pageable);

    PagedResponse<RecommendationDto> getCandidateRecommendationsForJob(Long hrUserId, Long jobId, Pageable pageable);

    RecommendationDto computeRecommendationMatch(Long candidateId, Long jobId);
}
