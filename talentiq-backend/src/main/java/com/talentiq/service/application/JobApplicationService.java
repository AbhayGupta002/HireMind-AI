package com.talentiq.service.application;

import com.talentiq.common.response.PagedResponse;
import com.talentiq.dto.application.JobApplicationDto;
import org.springframework.data.domain.Pageable;

public interface JobApplicationService {

    JobApplicationDto.Response applyForJob(Long userId, JobApplicationDto.ApplyRequest request);

    JobApplicationDto.Response updateApplicationStatus(Long hrUserId, Long applicationId, JobApplicationDto.StatusUpdateRequest request);

    PagedResponse<JobApplicationDto.Response> getApplicationsForJob(Long hrUserId, Long jobId, Pageable pageable);

    PagedResponse<JobApplicationDto.Response> getApplicationsForHrCompany(Long hrUserId, Pageable pageable);

    PagedResponse<JobApplicationDto.Response> getCandidateApplications(Long userId, Pageable pageable);

    JobApplicationDto.Response getApplicationDetails(Long userId, Long applicationId);
}
