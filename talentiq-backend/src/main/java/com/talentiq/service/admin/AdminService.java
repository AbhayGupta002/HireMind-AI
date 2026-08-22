package com.talentiq.service.admin;

import com.talentiq.common.response.PagedResponse;
import com.talentiq.dto.admin.AdminDto;
import com.talentiq.dto.company.CompanyDto;
import com.talentiq.dto.user.UserDto;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    PagedResponse<UserDto.Response> listUsers(String search, Boolean enabled, Pageable pageable);

    UserDto.Response setUserEnabledStatus(Long adminUserId, Long targetUserId, AdminDto.UserStatusRequest request);

    PagedResponse<CompanyDto.Response> listPendingCompanies(Pageable pageable);

    CompanyDto.Response verifyCompany(Long adminUserId, Long companyId, AdminDto.CompanyVerificationRequest request);

    AdminDto.SystemMetricsResponse getSystemMetrics(Long adminUserId);
}
