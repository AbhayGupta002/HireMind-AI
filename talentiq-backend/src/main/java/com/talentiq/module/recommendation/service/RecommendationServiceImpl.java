package com.talentiq.module.recommendation.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.common.exception.ForbiddenException;
import com.talentiq.common.exception.ResourceNotFoundException;
import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.candidate.dto.CandidateDto;
import com.talentiq.module.candidate.entity.Candidate;
import com.talentiq.module.candidate.entity.CandidateSkill;
import com.talentiq.module.candidate.repository.CandidateRepository;
import com.talentiq.module.candidate.service.CandidateServiceImpl;
import com.talentiq.module.company.service.CompanyServiceImpl;
import com.talentiq.module.hr.entity.HrProfile;
import com.talentiq.module.hr.repository.HrProfileRepository;
import com.talentiq.module.job.dto.JobDto;
import com.talentiq.module.job.entity.Job;
import com.talentiq.module.job.entity.JobSkill;
import com.talentiq.module.job.repository.JobRepository;
import com.talentiq.module.recommendation.dto.RecommendationDto;
import com.talentiq.module.recommendation.entity.JobRecommendation;
import com.talentiq.module.recommendation.repository.JobRecommendationRepository;
import com.talentiq.module.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RecommendationServiceImpl implements RecommendationService {

    private final JobRecommendationRepository recommendationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final HrProfileRepository hrProfileRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<RecommendationDto> getJobRecommendationsForCandidate(Long userId, Pageable pageable) {
        Candidate candidate = candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "userId", userId));

        Page<JobRecommendation> recommendations = recommendationRepository.findAllByCandidateIdActive(candidate.getId(), pageable);

        // If no recommendations are cached, trigger a default compute of active jobs to seed cache
        if (recommendations.isEmpty()) {
            log.info("No cached recommendations found for candidate {}. Generating recommendations.", candidate.getId());
            generateInitialRecommendationsForCandidate(candidate);
            recommendations = recommendationRepository.findAllByCandidateIdActive(candidate.getId(), pageable);
        }

        return PagedResponse.of(recommendations.map(this::mapToDtoWithJob));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<RecommendationDto> getCandidateRecommendationsForJob(Long hrUserId, Long jobId, Pageable pageable) {
        HrProfile hrProfile = hrProfileRepository.findByUserId(hrUserId)
                .orElseThrow(() -> new ForbiddenException("Only company HR members can view candidate recommendations"));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!job.getCompany().getId().equals(hrProfile.getCompany().getId())) {
            throw new ForbiddenException("You cannot view recommendations for another company's job posting");
        }

        Page<JobRecommendation> recommendations = recommendationRepository.findAllByJobIdActive(jobId, pageable);

        if (recommendations.isEmpty()) {
            log.info("No cached recommendations found for job {}. Generating recommendations.", jobId);
            generateInitialRecommendationsForJob(job);
            recommendations = recommendationRepository.findAllByJobIdActive(jobId, pageable);
        }

        return PagedResponse.of(recommendations.map(this::mapToDtoWithCandidate));
    }

    @Override
    public RecommendationDto computeRecommendationMatch(Long candidateId, Long jobId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "id", candidateId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        JobRecommendation recommendation = calculateAndSaveMatch(candidate, job);
        return mapToDtoFull(recommendation);
    }

    // ── Algorithm matching logic ──────────────────────────────────────────────

    private JobRecommendation calculateAndSaveMatch(Candidate candidate, Job job) {
        // 1. Skill Score
        Set<String> candidateSkills = candidate.getSkills().stream()
                .map(s -> s.getSkillName().toLowerCase().trim())
                .collect(Collectors.toSet());

        List<JobSkill> requiredSkills = job.getRequiredSkills();
        List<String> matching = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        double skillScoreVal = 100.0;
        if (!requiredSkills.isEmpty()) {
            long totalRequired = requiredSkills.stream().filter(JobSkill::isRequired).count();
            long matchedRequired = 0;

            for (JobSkill js : requiredSkills) {
                String skillName = js.getSkillName().toLowerCase().trim();
                if (candidateSkills.contains(skillName)) {
                    matching.add(js.getSkillName());
                    if (js.isRequired()) matchedRequired++;
                } else {
                    missing.add(js.getSkillName());
                }
            }

            if (totalRequired > 0) {
                skillScoreVal = ((double) matchedRequired / totalRequired) * 100.0;
            }
        }

        // 2. Experience Score
        double expScoreVal = 100.0;
        int candidateYears = candidate.getYearsExperience() != null ? candidate.getYearsExperience() : 0;
        // Map experience level to estimated required years
        int estimatedRequiredYears = switch (job.getExperienceLevel()) {
            case ENTRY -> 0;
            case JUNIOR -> 1;
            case MID -> 3;
            case SENIOR -> 5;
            case LEAD, PRINCIPAL -> 8;
            default -> 3;
        };

        if (estimatedRequiredYears > 0) {
            expScoreVal = Math.min(100.0, ((double) candidateYears / estimatedRequiredYears) * 100.0);
        }

        // 3. Location Score (Remote / Hybrid / Location matching)
        double locScoreVal = 50.0;
        if (job.isRemote()) {
            locScoreVal = 100.0;
        } else if (candidate.getLocation() != null && job.getLocation() != null) {
            String cLoc = candidate.getLocation().toLowerCase().trim();
            String jLoc = job.getLocation().toLowerCase().trim();
            if (cLoc.contains(jLoc) || jLoc.contains(cLoc)) {
                locScoreVal = 100.0;
            } else if (job.isHybrid()) {
                locScoreVal = 70.0;
            }
        }

        // 4. Semantic / Education Mock Score
        double eduScoreVal = 80.0;
        double semanticScoreVal = 75.0; // Mock semantic mapping for Phase 1

        // 5. Overall Weighted average
        // 40% Skills, 30% Experience, 15% Location, 15% Education
        double overallScoreVal = (skillScoreVal * 0.40) + (expScoreVal * 0.30) + (locScoreVal * 0.15) + (eduScoreVal * 0.15);

        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        if (skillScoreVal >= 80) strengths.add("Strong skill set match for the role");
        if (expScoreVal >= 100) strengths.add("Meets or exceeds years of experience requirements");
        if (locScoreVal >= 100) strengths.add("Excellent location alignment (remote / local)");

        if (missing.size() > 2) improvements.add("Acquire skills: " + String.join(", ", missing.subList(0, Math.min(3, missing.size()))));
        if (expScoreVal < 70) improvements.add("Gain more experience in similar roles");

        JobRecommendation recommendation = recommendationRepository.findByCandidateIdAndJobId(candidate.getId(), job.getId())
                .orElseGet(() -> JobRecommendation.builder().candidate(candidate).job(job).build());

        try {
            recommendation.setOverallScore(BigDecimal.valueOf(overallScoreVal).setScale(2, RoundingMode.HALF_UP));
            recommendation.setSkillScore(BigDecimal.valueOf(skillScoreVal).setScale(2, RoundingMode.HALF_UP));
            recommendation.setExperienceScore(BigDecimal.valueOf(expScoreVal).setScale(2, RoundingMode.HALF_UP));
            recommendation.setEducationScore(BigDecimal.valueOf(eduScoreVal).setScale(2, RoundingMode.HALF_UP));
            recommendation.setLocationScore(BigDecimal.valueOf(locScoreVal).setScale(2, RoundingMode.HALF_UP));
            recommendation.setSemanticScore(BigDecimal.valueOf(semanticScoreVal).setScale(2, RoundingMode.HALF_UP));
            recommendation.setMatchingSkills(objectMapper.writeValueAsString(matching));
            recommendation.setMissingSkills(objectMapper.writeValueAsString(missing));
            recommendation.setStrengths(objectMapper.writeValueAsString(strengths));
            recommendation.setImprovementSuggestions(objectMapper.writeValueAsString(improvements));
            recommendation.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS)); // Cached for 7 days
        } catch (Exception ignored) {}

        return recommendationRepository.save(recommendation);
    }

    private void generateInitialRecommendationsForCandidate(Candidate candidate) {
        Page<Job> activeJobs = jobRepository.findActiveJobs(Pageable.unpaged());
        for (Job job : activeJobs.getContent()) {
            calculateAndSaveMatch(candidate, job);
        }
    }

    private void generateInitialRecommendationsForJob(Job job) {
        Page<Candidate> candidates = candidateRepository.findAll(Pageable.unpaged());
        for (Candidate candidate : candidates.getContent()) {
            calculateAndSaveMatch(candidate, job);
        }
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private RecommendationDto mapToDtoWithJob(JobRecommendation rec) {
        return RecommendationDto.builder()
                .id(rec.getId())
                .job(mapJobToResponse(rec.getJob()))
                .overallScore(rec.getOverallScore())
                .skillScore(rec.getSkillScore())
                .experienceScore(rec.getExperienceScore())
                .educationScore(rec.getEducationScore())
                .locationScore(rec.getLocationScore())
                .semanticScore(rec.getSemanticScore())
                .matchingSkills(parseJsonList(rec.getMatchingSkills()))
                .missingSkills(parseJsonList(rec.getMissingSkills()))
                .strengths(parseJsonList(rec.getStrengths()))
                .improvementSuggestions(parseJsonList(rec.getImprovementSuggestions()))
                .build();
    }

    private RecommendationDto mapToDtoWithCandidate(JobRecommendation rec) {
        return RecommendationDto.builder()
                .id(rec.getId())
                .candidate(mapCandidateToResponse(rec.getCandidate()))
                .overallScore(rec.getOverallScore())
                .skillScore(rec.getSkillScore())
                .experienceScore(rec.getExperienceScore())
                .educationScore(rec.getEducationScore())
                .locationScore(rec.getLocationScore())
                .semanticScore(rec.getSemanticScore())
                .matchingSkills(parseJsonList(rec.getMatchingSkills()))
                .missingSkills(parseJsonList(rec.getMissingSkills()))
                .strengths(parseJsonList(rec.getStrengths()))
                .improvementSuggestions(parseJsonList(rec.getImprovementSuggestions()))
                .build();
    }

    private RecommendationDto mapToDtoFull(JobRecommendation rec) {
        return RecommendationDto.builder()
                .id(rec.getId())
                .job(mapJobToResponse(rec.getJob()))
                .candidate(mapCandidateToResponse(rec.getCandidate()))
                .overallScore(rec.getOverallScore())
                .skillScore(rec.getSkillScore())
                .experienceScore(rec.getExperienceScore())
                .educationScore(rec.getEducationScore())
                .locationScore(rec.getLocationScore())
                .semanticScore(rec.getSemanticScore())
                .matchingSkills(parseJsonList(rec.getMatchingSkills()))
                .missingSkills(parseJsonList(rec.getMissingSkills()))
                .strengths(parseJsonList(rec.getStrengths()))
                .improvementSuggestions(parseJsonList(rec.getImprovementSuggestions()))
                .build();
    }

    private List<String> parseJsonList(String json) {
        if (json == null) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private JobDto.Response mapJobToResponse(Job job) {
        return JobDto.Response.builder()
                .id(job.getId())
                .company(CompanyServiceImpl.mapToResponse(job.getCompany()))
                .title(job.getTitle())
                .slug(job.getSlug())
                .location(job.getLocation())
                .jobType(job.getJobType())
                .remote(job.isRemote())
                .hybrid(job.isHybrid())
                .build();
    }

    private CandidateDto.Response mapCandidateToResponse(Candidate candidate) {
        User user = candidate.getUser();
        return CandidateDto.Response.builder()
                .id(candidate.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .headline(candidate.getHeadline())
                .location(candidate.getLocation())
                .build();
    }
}
