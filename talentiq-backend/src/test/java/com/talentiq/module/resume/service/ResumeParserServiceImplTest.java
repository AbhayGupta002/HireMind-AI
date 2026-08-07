package com.talentiq.module.resume.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.common.enums.Role;
import com.talentiq.config.AppProperties;
import com.talentiq.infrastructure.storage.FileStorageService;
import com.talentiq.module.candidate.entity.Candidate;
import com.talentiq.module.candidate.repository.CandidateRepository;
import com.talentiq.module.resume.dto.ResumeDto;
import com.talentiq.module.resume.entity.Resume;
import com.talentiq.module.resume.repository.ResumeParsedDataRepository;
import com.talentiq.module.resume.repository.ResumeRepository;
import com.talentiq.module.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ResumeParserService Unit Tests")
class ResumeParserServiceImplTest {

    @Mock private ResumeRepository resumeRepository;
    @Mock private ResumeParsedDataRepository parsedDataRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private ResumeTextExtractor textExtractor;
    @Mock private AppProperties appProperties;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ResumeParserServiceImpl parserService;

    private User candidateUser;
    private Candidate candidate;
    private Resume resume;

    @BeforeEach
    void setUp() {
        candidateUser = User.builder()
                .id(1L)
                .email("candidate@example.com")
                .roles(Set.of(Role.ROLE_CANDIDATE))
                .build();

        candidate = Candidate.builder()
                .id(100L)
                .user(candidateUser)
                .skills(new ArrayList<>())
                .experiences(new ArrayList<>())
                .educations(new ArrayList<>())
                .projects(new ArrayList<>())
                .build();

        resume = Resume.builder()
                .id(500L)
                .candidate(candidate)
                .fileUrl("resumes/my_resume.pdf")
                .build();

        AppProperties.AiProperties aiProps = new AppProperties.AiProperties();
        aiProps.setProvider("openai");
        AppProperties.AiProperties.OpenAiProperties openAi = new AppProperties.AiProperties.OpenAiProperties();
        openAi.setApiKey("test-key"); // Trigger mock parser fallback
        aiProps.setOpenai(openAi);

        when(appProperties.getAi()).thenReturn(aiProps);
    }

    @Test
    @DisplayName("should parse resume, save parsed data, and populate candidate profile using mock parser fallback")
    void shouldParseResumeSuccessfully() {
        when(resumeRepository.findById(500L)).thenReturn(Optional.of(resume));
        when(fileStorageService.retrieveFile("resumes/my_resume.pdf")).thenReturn("dummy content".getBytes());
        when(textExtractor.extractText(any())).thenReturn("Raw text from PDF");
        when(resumeRepository.save(any(Resume.class))).thenAnswer(i -> i.getArgument(0));

        ResumeDto response = parserService.parseResume(500L);

        assertThat(response).isNotNull();
        assertThat(response.isParsed()).isTrue();
        assertThat(response.getParseStatus()).isEqualTo("DONE");

        verify(parsedDataRepository).save(any());
        verify(candidateRepository).save(candidate);

        // Verify skills got populated
        assertThat(candidate.getSkills()).isNotEmpty();
        assertThat(candidate.getSkills().get(0).getSkillName()).isEqualTo("Java");
    }
}
