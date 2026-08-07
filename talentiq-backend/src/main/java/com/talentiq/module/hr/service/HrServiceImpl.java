package com.talentiq.module.hr.service;

import com.talentiq.common.exception.BadRequestException;
import com.talentiq.common.exception.ForbiddenException;
import com.talentiq.common.exception.ResourceNotFoundException;
import com.talentiq.module.company.entity.Company;
import com.talentiq.module.company.repository.CompanyRepository;
import com.talentiq.module.company.service.CompanyServiceImpl;
import com.talentiq.module.hr.dto.HrDto;
import com.talentiq.module.hr.entity.HrProfile;
import com.talentiq.module.hr.repository.HrProfileRepository;
import com.talentiq.module.user.entity.User;
import com.talentiq.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HrServiceImpl implements HrService {

    private final HrProfileRepository hrProfileRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Override
    public HrDto.Response joinCompany(Long userId, HrDto.JoinRequest request) {
        if (hrProfileRepository.existsByUserId(userId)) {
            throw new BadRequestException("You are already associated with a company profile");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", "id", request.getCompanyId()));

        HrProfile profile = HrProfile.builder()
                .user(user)
                .company(company)
                .designation(request.getDesignation())
                .department(request.getDepartment())
                .companyAdmin(false)
                .build();

        HrProfile saved = hrProfileRepository.save(profile);
        log.info("HR user {} joined company {}", user.getEmail(), company.getName());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public HrDto.Response getHrProfile(Long userId) {
        HrProfile profile = hrProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("HR Profile", "userId", userId));
        return mapToResponse(profile);
    }

    @Override
    public HrDto.Response updateHrProfile(Long userId, HrDto.UpdateRequest request) {
        HrProfile profile = hrProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("HR Profile", "userId", userId));

        if (request.getDesignation() != null) profile.setDesignation(request.getDesignation().trim());
        if (request.getDepartment() != null) profile.setDepartment(request.getDepartment().trim());

        HrProfile saved = hrProfileRepository.save(profile);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HrDto.Response> listCompanyHrProfiles(Long companyId) {
        List<HrProfile> profiles = hrProfileRepository.findAllByCompanyId(companyId);
        return profiles.stream().map(this::mapToResponse).toList();
    }

    @Override
    public HrDto.Response setCompanyAdmin(Long adminUserId, Long targetHrId, boolean makeAdmin) {
        // Enforce that requester is a Company Admin
        HrProfile requester = hrProfileRepository.findByUserId(adminUserId)
                .orElseThrow(() -> new ForbiddenException("Only company administrators can perform this action"));

        if (!requester.isCompanyAdmin()) {
            throw new ForbiddenException("Only company administrators can perform this action");
        }

        HrProfile target = hrProfileRepository.findById(targetHrId)
                .orElseThrow(() -> new ResourceNotFoundException("HR Profile", "id", targetHrId));

        // Enforce same-company constraint
        if (!target.getCompany().getId().equals(requester.getCompany().getId())) {
            throw new ForbiddenException("Target HR is not in the same company");
        }

        target.setCompanyAdmin(makeAdmin);
        HrProfile saved = hrProfileRepository.save(target);
        log.info("HR admin status of user {} set to {} by {}", target.getUser().getEmail(), makeAdmin, requester.getUser().getEmail());
        return mapToResponse(saved);
    }

    private HrDto.Response mapToResponse(HrProfile profile) {
        User user = profile.getUser();
        return HrDto.Response.builder()
                .id(profile.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .company(CompanyServiceImpl.mapToResponse(profile.getCompany()))
                .designation(profile.getDesignation())
                .department(profile.getDepartment())
                .companyAdmin(profile.isCompanyAdmin())
                .active(profile.isActive())
                .build();
    }
}
