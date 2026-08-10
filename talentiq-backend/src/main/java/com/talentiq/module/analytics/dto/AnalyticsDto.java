package com.talentiq.module.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsDto {

    @Data
    public static class EventRequest {
        @NotBlank(message = "Event type is required")
        private String eventType;

        private String entityType;
        private Long entityId;
        private Map<String, Object> properties;
    }

    @Data
    @Builder
    public static class MonthlyStats {
        private String month;          // "Jan", "Feb", ...
        private long applications;
        private long shortlisted;
        private long rejected;
    }

    @Data
    @Builder
    public static class HrDashboardResponse {
        private Long companyId;
        private String companyName;
        private long activeJobsCount;
        private long totalApplicationsCount;
        private long shortlistedCount;
        private long hiredCandidatesCount;
        private BigDecimal conversionRate;
        private BigDecimal avgTimeToHireDays;
        private Map<String, Long> applicationsByStatus;
        private List<MonthlyStats> monthlyStats;
    }

    @Data
    @Builder
    public static class PlatformOverviewResponse {
        private long totalUsersCount;
        private long totalCandidatesCount;
        private long totalCompaniesCount;
        private long totalJobsCount;
        private long totalApplicationsCount;
        private long totalResumesUploadedCount;
    }
}
