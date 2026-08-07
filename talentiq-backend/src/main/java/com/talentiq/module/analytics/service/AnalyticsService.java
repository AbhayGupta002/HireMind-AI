package com.talentiq.module.analytics.service;

import com.talentiq.module.analytics.dto.AnalyticsDto;

public interface AnalyticsService {

    void logEvent(Long userId, AnalyticsDto.EventRequest request, String ipAddress, String userAgent);

    AnalyticsDto.HrDashboardResponse getHrAnalyticsDashboard(Long hrUserId);

    AnalyticsDto.PlatformOverviewResponse getPlatformOverview(Long adminUserId);
}
