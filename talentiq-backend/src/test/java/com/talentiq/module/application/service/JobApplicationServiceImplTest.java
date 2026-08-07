package com.talentiq.module.application.service;

import com.talentiq.common.enums.ApplicationStatus;
import com.talentiq.common.enums.JobStatus;
import com.talentiq.common.enums.JobType;
import com.talentiq.common.exception.BadRequestException;
import com.talentiq.module.application.dto.JobApplicationDto;
import com.talentiq.module.application.entity.JobApplication;
import com.talentiq.module.application.repository.ApplicationStatusHistoryRepository;
import com.talentiq.module.application.repository.JobApplicationRepository;
import com.talentiq.module.candidate.entity.Candidate;
import com.talentiq.module.candidate.repository.CandidateRepository;
import com.talentiq.module.job.entity.Job;
import com.talentiq.module.job.repository.JobRepository;
import com.talentiq.module.recommendation.repository.JobRecommendationRepository;
import com.talentiq.module.recommendation.service.RecommendationService;
import com.talentiq.module.resume.entity.Resume;
import com.talentiq.module.resume.repository.ResumeRepository;
import com.talentiq.module.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobApplicationService Unit Tests")
class JobApplicationServiceImplTest {

    @Mock private JobApplicationRepository applicationRepository;
    @Mock private ApplicationStatusHistoryRepository historyRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private JobRepository jobRepository;
    @Mock private ResumeRepository resumeRepository;
    @Mock private JobRecommendationRepository recommendationRepository;
    @Mock private RecommendationService recommendationService;

    @InjectMocks
    private JobApplicationServiceImpl applicationService;

    private Candidate candidate;
    private Job job;
    private Resume resume;
    private JobApplicationDto.ApplyRequest applyReq;

    @BeforeEach
    void setUp() {
        candidate = Candidate.builder()
                .id(10L)
                .user(User.builder().id(1L).build())
                .build();

        job = Job.builder()
                .id(20L)
                .title("Engineer")
                .status(JobStatus.ACTIVE)
                .company(com.talentiq.module.company.entity.Company.builder().id(100L).build())
                .build();

        resume = Resume.builder()
                .id(30L)
                .candidate(candidate)
                .build();

        applyReq = new JobApplicationDto.ApplyRequest();
        applyReq.setJobId(20L);
        applyReq.setResumeId(30L);
        applyReq.setCoverLetter("Hello, I am interested in this role.");
    }

    @Test
    @DisplayName("should submit job application successfully and trigger counter updates")
    void shouldSubmitApplicationSuccessfully() {
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(jobRepository.findById(20L)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndCandidateId(20L, 10L)).thenReturn(false);
        when(resumeRepository.findById(30L)).thenReturn(Optional.of(resume));
        when(recommendationRepository.findByCandidateIdAndJobId(10L, 20L)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(i -> {
            JobApplication app = i.getArgument(0);
            app.setId(1000L);
            return app;
        });

        JobApplicationDto.Response response = applicationService.applyForJob(1L, applyReq);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1000L);
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPLIED);

        verify(applicationRepository).save(any(JobApplication.class));
        verify(historyRepository).save(any());
        verify(jobRepository).save(job);
    }

    @Test
    @DisplayName("should throw BadRequestException if candidate has already applied")
    void shouldThrowIfAlreadyApplied() {
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(jobRepository.findById(20L)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndCandidateId(20L, 10L)).thenReturn(true);

        assertThatThrownBy(() -> applicationService.applyForJob(1L, applyReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already applied");
    }
}
