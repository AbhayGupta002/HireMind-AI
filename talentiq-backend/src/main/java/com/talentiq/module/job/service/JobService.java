package com.talentiq.module.job.service;

import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.job.dto.JobDto;
import com.talentiq.module.job.dto.JobSearchFilter;
import org.springframework.data.domain.Pageable;

public interface JobService {

    JobDto.Response createJob(Long hrUserId, JobDto.CreateRequest request);

    JobDto.Response getJobById(Long id);

    JobDto.Response getJobBySlug(String slug);

    JobDto.Response updateJob(Long hrUserId, Long jobId, JobDto.UpdateRequest request);

    void deleteJob(Long hrUserId, Long jobId);

    PagedResponse<JobDto.Response> searchJobs(JobSearchFilter filter, Pageable pageable);

    void saveJob(Long userId, Long jobId);

    void unsaveJob(Long userId, Long jobId);

    PagedResponse<JobDto.Response> listSavedJobs(Long userId, Pageable pageable);

    PagedResponse<JobDto.Response> listJobsByCompany(Long companyId, Pageable pageable);
}
