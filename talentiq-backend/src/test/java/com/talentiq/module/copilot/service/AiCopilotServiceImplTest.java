package com.talentiq.service.copilot;

import com.talentiq.common.enums.Role;
import com.talentiq.config.AppProperties;
import com.talentiq.model.Company;
import com.talentiq.dto.copilot.AiCopilotDto;
import com.talentiq.model.AiConversation;
import com.talentiq.model.AiMessage;
import com.talentiq.repository.copilot.AiConversationRepository;
import com.talentiq.repository.copilot.AiCopilotConfigRepository;
import com.talentiq.repository.copilot.AiMessageRepository;
import com.talentiq.model.HrProfile;
import com.talentiq.repository.hr.HrProfileRepository;
import com.talentiq.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AiCopilotService Unit Tests")
class AiCopilotServiceImplTest {

    @Mock private AiConversationRepository conversationRepository;
    @Mock private AiMessageRepository messageRepository;
    @Mock private AiCopilotConfigRepository configRepository;
    @Mock private HrProfileRepository hrProfileRepository;
    @Mock private AppProperties appProperties;

    @InjectMocks
    private AiCopilotServiceImpl copilotService;

    private User hrUser;
    private Company company;
    private HrProfile hrProfile;
    private AiConversation conversation;
    private AiCopilotDto.ConversationRequest createReq;

    @BeforeEach
    void setUp() {
        hrUser = User.builder()
                .id(1L)
                .email("recruiter@tech.com")
                .roles(Set.of(Role.ROLE_HR))
                .build();

        company = Company.builder()
                .id(100L)
                .name("Tech Corp")
                .build();

        hrProfile = HrProfile.builder()
                .id(10L)
                .user(hrUser)
                .company(company)
                .build();

        conversation = AiConversation.builder()
                .id(500L)
                .hr(hrUser)
                .company(company)
                .contextType("GENERAL")
                .build();

        createReq = new AiCopilotDto.ConversationRequest();
        createReq.setTitle("General QA session");
        createReq.setContextType("GENERAL");

        AppProperties.AiProperties aiProps = new AppProperties.AiProperties();
        aiProps.setProvider("openai");
        AppProperties.AiProperties.OpenAiProperties openAi = new AppProperties.AiProperties.OpenAiProperties();
        openAi.setApiKey("test-key"); // fallback mock responses
        aiProps.setOpenai(openAi);

        lenient().when(appProperties.getAi()).thenReturn(aiProps);
    }

    @Test
    @DisplayName("should create AI conversation session successfully")
    void shouldCreateConversationSuccessfully() {
        when(hrProfileRepository.findByUserId(1L)).thenReturn(Optional.of(hrProfile));
        when(conversationRepository.save(any(AiConversation.class))).thenAnswer(i -> {
            AiConversation c = i.getArgument(0);
            c.setId(500L);
            return c;
        });

        AiCopilotDto.ConversationResponse response = copilotService.createConversation(1L, createReq);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(500L);
        assertThat(response.getTitle()).isEqualTo("General QA session");

        verify(conversationRepository).save(any(AiConversation.class));
    }

    @Test
    @DisplayName("should send prompt message and return mock assistant response successfully")
    void shouldSendMessageAndReturnMockResponse() {
        when(hrProfileRepository.findByUserId(1L)).thenReturn(Optional.of(hrProfile));
        when(conversationRepository.findById(500L)).thenReturn(Optional.of(conversation));
        when(configRepository.findByHrId(1L)).thenReturn(Optional.empty());

        AiCopilotDto.MessageResponse response = copilotService.sendMessage(1L, 500L, "Hello copilot, who are you?");

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo("ASSISTANT");
        assertThat(response.getContent()).contains("TalentIQ AI Copilot");

        verify(messageRepository, times(2)).save(any(AiMessage.class));
    }
}
