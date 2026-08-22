package com.talentiq.module.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.common.enums.ApplicationStatus;
import com.talentiq.common.enums.JobStatus;
import com.talentiq.common.exception.ForbiddenException;
import com.talentiq.module.analytics.dto.AnalyticsDto;
import com.talentiq.module.analytics.entity.AnalyticsEvent;
import com.talentiq.module.analytics.repository.AnalyticsEventRepository;
import com.talentiq.module.analytics.repository.HrAnalyticsSnapshotRepository;
import com.talentiq.module.application.entity.JobApplication;
import com.talentiq.module.application.repository.JobApplicationRepository;
import com.talentiq.module.candidate.repository.CandidateRepository;
import com.talentiq.module.company.entity.Company;
import com.talentiq.module.company.repository.CompanyRepository;
import com.talentiq.module.hr.entity.HrProfile;
import com.talentiq.module.hr.repository.HrProfileRepository;
import com.talentiq.module.job.entity.Job;
import com.talentiq.module.job.repository.JobRepository;
import com.talentiq.module.resume.repository.ResumeRepository;
import com.talentiq.module.user.entity.User;
import com.talentiq.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsEventRepository eventRepository;
    private final HrAnalyticsSnapshotRepository snapshotRepository;
    private final HrProfileRepository hrProfileRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final CompanyRepository companyRepository;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Async("asyncExecutor")
    public void logEvent(Long userId, AnalyticsDto.EventRequest request, String ipAddress, String userAgent) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            String propertiesJson = request.getProperties() != null ? objectMapper.writeValueAsString(request.getProperties()) : null;

            AnalyticsEvent event = AnalyticsEvent.builder()
                    .user(user)
                    .eventType(request.getEventType().toUpperCase().trim())
                    .entityType(request.getEntityType() != null ? request.getEntityType().toUpperCase().trim() : null)
                    .entityId(request.getEntityId())
                    .propertiesJson(propertiesJson)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            eventRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to record telemetry analytics event: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDto.HrDashboardResponse getHrAnalyticsDashboard(Long hrUserId) {
        HrProfile hrProfile = hrProfileRepository.findByUserId(hrUserId).orElse(null);
        Company company = hrProfile != null ? hrProfile.getCompany() : null;

        if (company == null) {
            return AnalyticsDto.HrDashboardResponse.builder()
                    .companyId(0L)
                    .companyName("My Organization")
                    .activeJobsCount(0)
                    .totalApplicationsCount(0)
                    .shortlistedCount(0)
                    .hiredCandidatesCount(0)
                    .conversionRate(BigDecimal.ZERO)
                    .avgTimeToHireDays(BigDecimal.valueOf(14.50))
                    .applicationsByStatus(new HashMap<>())
                    .monthlyStats(new ArrayList<>())
                    .build();
        }

        // Fetch company jobs
        List<Job> companyJobs = jobRepository.findAllByCompanyId(company.getId(), Pageable.unpaged()).getContent();
        long activeJobsCount = companyJobs.stream().filter(j -> j.getStatus().equals(JobStatus.ACTIVE)).count();

        // Calculate applications and status distributions
        Map<String, Long> statusDistribution = new HashMap<>();
        long totalAppsCount = 0;
        long hiresCount = 0;

        for (Job job : companyJobs) {
            List<JobApplication> apps = applicationRepository.findAllByJobId(job.getId(), Pageable.unpaged()).getContent();
            totalAppsCount += apps.size();

            for (JobApplication app : apps) {
                String key = app.getStatus().name();
                statusDistribution.put(key, statusDistribution.getOrDefault(key, 0L) + 1);
                if (app.getStatus() == ApplicationStatus.OFFERED || app.getStatus() == ApplicationStatus.INTERVIEWING) {
                    hiresCount++;
                }
            }
        }

        // Compute shortlisted count (SHORTLISTED status)
        long shortlistedCount = statusDistribution.getOrDefault(ApplicationStatus.SHORTLISTED.name(), 0L);

        BigDecimal conversionRate = BigDecimal.ZERO;
        if (totalAppsCount > 0) {
            conversionRate = BigDecimal.valueOf(((double) hiresCount / totalAppsCount) * 100.0)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Build monthly stats for last 6 months (for bar chart)
        List<AnalyticsDto.MonthlyStats> monthlyStats = buildMonthlyStats(companyJobs);

        return AnalyticsDto.HrDashboardResponse.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .activeJobsCount(activeJobsCount)
                .totalApplicationsCount(totalAppsCount)
                .shortlistedCount(shortlistedCount)
                .hiredCandidatesCount(hiresCount)
                .conversionRate(conversionRate)
                .avgTimeToHireDays(BigDecimal.valueOf(14.50))
                .applicationsByStatus(statusDistribution)
                .monthlyStats(monthlyStats)
                .build();
    }

    /**
     * Aggregate application counts per month for the last 6 months.
     */
    private List<AnalyticsDto.MonthlyStats> buildMonthlyStats(List<Job> companyJobs) {
        // Collect all applications for this company
        Map<String, long[]> monthMap = new java.util.LinkedHashMap<>();
        ZoneId zone = ZoneId.of("UTC");
        ZonedDateTime now = ZonedDateTime.now(zone);

        // Pre-populate last 6 months in order
        for (int i = 5; i >= 0; i--) {
            ZonedDateTime m = now.minusMonths(i);
            String key = m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + m.getYear();
            monthMap.put(key, new long[]{0, 0, 0}); // [applications, shortlisted, rejected]
        }

        Instant sixMonthsAgo = now.minusMonths(6).toInstant();

        for (Job job : companyJobs) {
            List<JobApplication> apps = applicationRepository
                    .findAllByJobId(job.getId(), Pageable.unpaged()).getContent();
            for (JobApplication app : apps) {
                if (app.getAppliedAt().isBefore(sixMonthsAgo)) continue;
                ZonedDateTime appliedAt = app.getAppliedAt().atZone(zone);
                String key = appliedAt.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + appliedAt.getYear();
                long[] counts = monthMap.get(key);
                if (counts != null) {
                    counts[0]++; // applications
                    if (app.getStatus() == ApplicationStatus.SHORTLISTED || app.getStatus() == ApplicationStatus.INTERVIEWING) counts[1]++;
                    if (app.getStatus() == ApplicationStatus.REJECTED) counts[2]++;
                }
            }
        }

        List<AnalyticsDto.MonthlyStats> result = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : monthMap.entrySet()) {
            long[] c = entry.getValue();
            result.add(AnalyticsDto.MonthlyStats.builder()
                    .month(entry.getKey())
                    .applications(c[0])
                    .shortlisted(c[1])
                    .rejected(c[2])
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDto.PlatformOverviewResponse getPlatformOverview(Long adminUserId) {
        long totalUsers = userRepository.count();
        long totalCandidates = candidateRepository.count();
        long totalCompanies = companyRepository.count();
        long totalJobs = jobRepository.count();
        long totalApplications = applicationRepository.count();
        long totalResumes = resumeRepository.count();

        return AnalyticsDto.PlatformOverviewResponse.builder()
                .totalUsersCount(totalUsers)
                .totalCandidatesCount(totalCandidates)
                .totalCompaniesCount(totalCompanies)
                .totalJobsCount(totalJobs)
                .totalApplicationsCount(totalApplications)
                .totalResumesUploadedCount(totalResumes)
                .build();
    }
}
