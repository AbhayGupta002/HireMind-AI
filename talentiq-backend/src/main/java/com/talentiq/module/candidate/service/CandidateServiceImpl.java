package com.talentiq.module.candidate.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.common.exception.ResourceNotFoundException;
import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.candidate.dto.CandidateDto;
import com.talentiq.module.candidate.entity.*;
import com.talentiq.module.candidate.repository.*;
import com.talentiq.module.user.entity.User;
import com.talentiq.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateSkillRepository skillRepository;
    private final CandidateExperienceRepository experienceRepository;
    private final CandidateEducationRepository educationRepository;
    private final CandidateProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public CandidateDto.Response getProfileByUserId(Long userId) {
        Candidate candidate = getOrCreateCandidate(userId);
        return mapToResponse(candidate);
    }

    @Override
    @Transactional(readOnly = true)
    public CandidateDto.Response getProfileById(Long candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));
        return mapToResponse(candidate);
    }

    @Override
    public CandidateDto.Response updateProfile(Long userId, CandidateDto.ProfileUpdateRequest request) {
        Candidate candidate = getOrCreateCandidate(userId);

        if (request.getHeadline() != null) candidate.setHeadline(request.getHeadline());
        if (request.getBio() != null) candidate.setBio(request.getBio());
        if (request.getLocation() != null) candidate.setLocation(request.getLocation());
        if (request.getGithubUrl() != null) candidate.setGithubUrl(request.getGithubUrl());
        if (request.getLinkedinUrl() != null) candidate.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getWebsiteUrl() != null) candidate.setWebsiteUrl(request.getWebsiteUrl());
        if (request.getYearsExperience() != null) candidate.setYearsExperience(request.getYearsExperience());
        if (request.getCurrentTitle() != null) candidate.setCurrentTitle(request.getCurrentTitle());
        if (request.getCurrentCompany() != null) candidate.setCurrentCompany(request.getCurrentCompany());
        if (request.getExpectedSalary() != null) candidate.setExpectedSalary(request.getExpectedSalary());
        if (request.getAvailability() != null) candidate.setAvailability(request.getAvailability());
        if (request.getExperienceLevel() != null) candidate.setExperienceLevel(request.getExperienceLevel());
        if (request.getOpenToWork() != null) candidate.setOpenToWork(request.getOpenToWork());

        candidate.calculateProfileCompletion();
        Candidate updated = candidateRepository.save(candidate);
        return mapToResponse(updated);
    }

    @Override
    public CandidateDto.Response addSkill(Long userId, CandidateDto.SkillRequest request) {
        Candidate candidate = getOrCreateCandidate(userId);

        CandidateSkill skill = CandidateSkill.builder()
                .candidate(candidate)
                .skillName(request.getSkillName().trim())
                .proficiency(request.getProficiency())
                .years(request.getYears() != null ? request.getYears() : 0)
                .primary(Boolean.TRUE.equals(request.getPrimary()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        candidate.getSkills().add(skill);
        candidate.calculateProfileCompletion();
        Candidate updated = candidateRepository.save(candidate);
        return mapToResponse(updated);
    }

    @Override
    public void deleteSkill(Long userId, Long skillId) {
        Candidate candidate = getOrCreateCandidate(userId);
        candidate.getSkills().removeIf(s -> s.getId().equals(skillId));
        candidate.calculateProfileCompletion();
        candidateRepository.save(candidate);
    }

    @Override
    public CandidateDto.Response addExperience(Long userId, CandidateDto.ExperienceRequest request) {
        Candidate candidate = getOrCreateCandidate(userId);

        CandidateExperience exp = CandidateExperience.builder()
                .candidate(candidate)
                .company(request.getCompany())
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .employmentType(request.getEmploymentType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .current(Boolean.TRUE.equals(request.getCurrent()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        candidate.getExperiences().add(exp);
        candidate.calculateProfileCompletion();
        Candidate updated = candidateRepository.save(candidate);
        return mapToResponse(updated);
    }

    @Override
    public void deleteExperience(Long userId, Long experienceId) {
        Candidate candidate = getOrCreateCandidate(userId);
        candidate.getExperiences().removeIf(e -> e.getId().equals(experienceId));
        candidate.calculateProfileCompletion();
        candidateRepository.save(candidate);
    }

    @Override
    public CandidateDto.Response addEducation(Long userId, CandidateDto.EducationRequest request) {
        Candidate candidate = getOrCreateCandidate(userId);

        CandidateEducation edu = CandidateEducation.builder()
                .candidate(candidate)
                .institution(request.getInstitution())
                .degree(request.getDegree())
                .fieldOfStudy(request.getFieldOfStudy())
                .gpa(request.getGpa())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .current(Boolean.TRUE.equals(request.getCurrent()))
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        candidate.getEducations().add(edu);
        candidate.calculateProfileCompletion();
        Candidate updated = candidateRepository.save(candidate);
        return mapToResponse(updated);
    }

    @Override
    public void deleteEducation(Long userId, Long educationId) {
        Candidate candidate = getOrCreateCandidate(userId);
        candidate.getEducations().removeIf(e -> e.getId().equals(educationId));
        candidate.calculateProfileCompletion();
        candidateRepository.save(candidate);
    }

    @Override
    public CandidateDto.Response addProject(Long userId, CandidateDto.ProjectRequest request) {
        Candidate candidate = getOrCreateCandidate(userId);

        String techStackJson = null;
        if (request.getTechStack() != null) {
            try {
                techStackJson = objectMapper.writeValueAsString(request.getTechStack());
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize techStack: {}", e.getMessage());
            }
        }

        CandidateProject proj = CandidateProject.builder()
                .candidate(candidate)
                .title(request.getTitle())
                .description(request.getDescription())
                .url(request.getUrl())
                .githubUrl(request.getGithubUrl())
                .techStack(techStackJson)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .featured(Boolean.TRUE.equals(request.getFeatured()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        candidate.getProjects().add(proj);
        candidate.calculateProfileCompletion();
        Candidate updated = candidateRepository.save(candidate);
        return mapToResponse(updated);
    }

    @Override
    public void deleteProject(Long userId, Long projectId) {
        Candidate candidate = getOrCreateCandidate(userId);
        candidate.getProjects().removeIf(p -> p.getId().equals(projectId));
        candidate.calculateProfileCompletion();
        candidateRepository.save(candidate);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CandidateDto.Response> searchCandidates(String skill, Pageable pageable) {
        Page<Candidate> candidates;
        if (skill != null && !skill.isBlank()) {
            candidates = candidateRepository.findBySkillName(skill, pageable);
        } else {
            candidates = candidateRepository.findAllOpenToWork(pageable);
        }
        Page<CandidateDto.Response> responsePage = candidates.map(this::mapToResponse);
        return PagedResponse.of(responsePage);
    }

    // Helper
    private Candidate getOrCreateCandidate(Long userId) {
        return candidateRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            Candidate newCandidate = Candidate.builder()
                    .user(user)
                    .profileCompletion(20)
                    .build();
            return candidateRepository.save(newCandidate);
        });
    }

    private CandidateDto.Response mapToResponse(Candidate candidate) {
        User user = candidate.getUser();

        List<CandidateDto.SkillResponse> skillResponses = candidate.getSkills().stream().map(s ->
                CandidateDto.SkillResponse.builder()
                        .id(s.getId())
                        .skillName(s.getSkillName())
                        .proficiency(s.getProficiency())
                        .years(s.getYears())
                        .primary(s.isPrimary())
                        .displayOrder(s.getDisplayOrder())
                        .build()
        ).toList();

        List<CandidateDto.ExperienceResponse> expResponses = candidate.getExperiences().stream().map(e ->
                CandidateDto.ExperienceResponse.builder()
                        .id(e.getId())
                        .company(e.getCompany())
                        .title(e.getTitle())
                        .description(e.getDescription())
                        .location(e.getLocation())
                        .employmentType(e.getEmploymentType())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .current(e.isCurrent())
                        .displayOrder(e.getDisplayOrder())
                        .build()
        ).toList();

        List<CandidateDto.EducationResponse> eduResponses = candidate.getEducations().stream().map(e ->
                CandidateDto.EducationResponse.builder()
                        .id(e.getId())
                        .institution(e.getInstitution())
                        .degree(e.getDegree())
                        .fieldOfStudy(e.getFieldOfStudy())
                        .gpa(e.getGpa())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .current(e.isCurrent())
                        .description(e.getDescription())
                        .displayOrder(e.getDisplayOrder())
                        .build()
        ).toList();

        List<CandidateDto.ProjectResponse> projResponses = candidate.getProjects().stream().map(p -> {
            List<String> stack = Collections.emptyList();
            if (p.getTechStack() != null) {
                try {
                    stack = objectMapper.readValue(p.getTechStack(), new TypeReference<List<String>>() {});
                } catch (Exception ignored) {}
            }
            return CandidateDto.ProjectResponse.builder()
                    .id(p.getId())
                    .title(p.getTitle())
                    .description(p.getDescription())
                    .url(p.getUrl())
                    .githubUrl(p.getGithubUrl())
                    .techStack(stack)
                    .startDate(p.getStartDate())
                    .endDate(p.getEndDate())
                    .featured(p.isFeatured())
                    .displayOrder(p.getDisplayOrder())
                    .build();
        }).toList();

        return CandidateDto.Response.builder()
                .id(candidate.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .headline(candidate.getHeadline())
                .bio(candidate.getBio())
                .location(candidate.getLocation())
                .githubUrl(candidate.getGithubUrl())
                .linkedinUrl(candidate.getLinkedinUrl())
                .websiteUrl(candidate.getWebsiteUrl())
                .yearsExperience(candidate.getYearsExperience())
                .currentTitle(candidate.getCurrentTitle())
                .currentCompany(candidate.getCurrentCompany())
                .expectedSalary(candidate.getExpectedSalary())
                .availability(candidate.getAvailability())
                .experienceLevel(candidate.getExperienceLevel())
                .openToWork(candidate.isOpenToWork())
                .profileCompletion(candidate.getProfileCompletion())
                .skills(skillResponses)
                .experiences(expResponses)
                .educations(eduResponses)
                .projects(projResponses)
                .build();
    }
}
