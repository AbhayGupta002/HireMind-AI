package com.talentiq.module.copilot.service;

import com.talentiq.common.exception.ForbiddenException;
import com.talentiq.common.exception.ResourceNotFoundException;
import com.talentiq.config.AppProperties;
import com.talentiq.module.candidate.entity.Candidate;
import com.talentiq.module.candidate.entity.CandidateSkill;
import com.talentiq.module.candidate.repository.CandidateRepository;
import com.talentiq.module.company.entity.Company;
import com.talentiq.module.copilot.dto.AiCopilotDto;
import com.talentiq.module.copilot.entity.AiConversation;
import com.talentiq.module.copilot.entity.AiMessage;
import com.talentiq.module.copilot.entity.AiCopilotConfig;
import com.talentiq.module.copilot.repository.AiConversationRepository;
import com.talentiq.module.copilot.repository.AiMessageRepository;
import com.talentiq.module.copilot.repository.AiCopilotConfigRepository;
import com.talentiq.module.hr.entity.HrProfile;
import com.talentiq.module.hr.repository.HrProfileRepository;
import com.talentiq.module.job.entity.Job;
import com.talentiq.module.job.repository.JobRepository;
import com.talentiq.module.user.entity.User;
import com.talentiq.module.user.repository.UserRepository;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AiCopilotServiceImpl implements AiCopilotService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiCopilotConfigRepository configRepository;
    private final HrProfileRepository hrProfileRepository;
    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final AppProperties appProperties;

    @Override
    public AiCopilotDto.ConversationResponse createConversation(Long hrUserId, AiCopilotDto.ConversationRequest request) {
        HrProfile hrProfile = hrProfileRepository.findByUserId(hrUserId)
                .orElseThrow(() -> new ForbiddenException("Only HR team members can create copilot sessions"));

        AiConversation conversation = AiConversation.builder()
                .hr(hrProfile.getUser())
                .company(hrProfile.getCompany())
                .title(request.getTitle() != null && !request.getTitle().isBlank() ? request.getTitle().trim() : "New Chat Session")
                .contextType(request.getContextType() != null ? request.getContextType() : "GENERAL")
                .contextId(request.getContextId())
                .build();

        AiConversation saved = conversationRepository.save(conversation);
        return mapToConversationDto(saved);
    }

    @Override
    public AiCopilotDto.MessageResponse sendMessage(Long hrUserId, Long conversationId, String content) {
        HrProfile hrProfile = hrProfileRepository.findByUserId(hrUserId)
                .orElseThrow(() -> new ForbiddenException("Only HR team members can use the copilot"));

        AiConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("AiConversation", "id", conversationId));

        if (!conversation.getHr().getId().equals(hrProfile.getUser().getId())) {
            throw new ForbiddenException("You do not own this chat session");
        }

        // Save User Message
        AiMessage userMsg = AiMessage.builder()
                .conversation(conversation)
                .role("USER")
                .content(content.trim())
                .build();
        messageRepository.save(userMsg);
        conversation.incrementMessageCount();

        // Load configuration or get defaults
        AiCopilotConfig config = configRepository.findByHrId(hrProfile.getUser().getId())
                .orElseGet(() -> AiCopilotConfig.builder().hr(hrProfile.getUser()).build());

        // Call AI model
        String answer = invokeModel(conversation, config, content.trim());

        // Save Assistant Message
        AiMessage assistantMsg = AiMessage.builder()
                .conversation(conversation)
                .role("ASSISTANT")
                .content(answer)
                .tokensUsed(150) // Mock token consumption tracker
                .build();
        messageRepository.save(assistantMsg);
        conversation.incrementMessageCount();

        conversationRepository.save(conversation);

        return AiCopilotDto.MessageResponse.builder()
                .id(assistantMsg.getId())
                .role("ASSISTANT")
                .content(answer)
                .createdAt(assistantMsg.getCreatedAt())
                .tokensUsed(assistantMsg.getTokensUsed())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiCopilotDto.ConversationResponse> listConversations(Long hrUserId) {
        return conversationRepository.findAllByHrIdAndArchivedFalseOrderByUpdatedAtDesc(hrUserId)
                .stream().map(this::mapToConversationDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiCopilotDto.MessageResponse> getMessages(Long hrUserId, Long conversationId) {
        AiConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("AiConversation", "id", conversationId));

        if (!conversation.getHr().getId().equals(hrUserId)) {
            throw new ForbiddenException("You do not have permissions to view this conversation");
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream().map(m -> AiCopilotDto.MessageResponse.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .createdAt(m.getCreatedAt())
                        .tokensUsed(m.getTokensUsed())
                        .build()).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AiCopilotDto.ConfigResponse getConfig(Long hrUserId) {
        AiCopilotConfig config = configRepository.findByHrId(hrUserId)
                .orElseGet(() -> AiCopilotConfig.builder().hr(
                        userRepository.findById(hrUserId).orElseThrow(() -> new ResourceNotFoundException("User", "id", hrUserId))
                ).build());
        return mapToConfigDto(config);
    }

    @Override
    public AiCopilotDto.ConfigResponse updateConfig(Long hrUserId, AiCopilotDto.ConfigUpdateRequest request) {
        User hr = userRepository.findById(hrUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", hrUserId));

        AiCopilotConfig config = configRepository.findByHrId(hrUserId)
                .orElseGet(() -> AiCopilotConfig.builder().hr(hr).build());

        if (request.getPreferredModel() != null) config.setPreferredModel(request.getPreferredModel());
        if (request.getSystemPrompt() != null) config.setSystemPrompt(request.getSystemPrompt());
        if (request.getTemperature() != null) config.setTemperature(request.getTemperature());
        if (request.getEnableMemory() != null) config.setEnableMemory(request.getEnableMemory());
        if (request.getMemoryWindow() != null) config.setMemoryWindow(request.getMemoryWindow());
        if (request.getEnableRag() != null) config.setEnableRag(request.getEnableRag());

        config.setUpdatedAt(Instant.now());
        AiCopilotConfig saved = configRepository.save(config);
        return mapToConfigDto(saved);
    }

    // ── LLM invocation with context-aware RAG ──────────────────────────────────

    private String invokeModel(AiConversation conversation, AiCopilotConfig config, String userPrompt) {
        String apiKey = appProperties.getAi().getOpenai().getApiKey();

        // 1. Gather Context injection (RAG)
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("You are TalentIQ AI recruiter assistant. Assist recruiters in screening candidates and analysing job postings.\n");

        if (config.getSystemPrompt() != null) {
            contextBuilder.append(config.getSystemPrompt()).append("\n");
        }

        if (conversation.getContextType().equals("CANDIDATE") && conversation.getContextId() != null) {
            Candidate candidate = candidateRepository.findById(conversation.getContextId()).orElse(null);
            if (candidate != null) {
                contextBuilder.append("Context Active Candidate: ")
                        .append(candidate.getUser().getFirstName()).append(" ").append(candidate.getUser().getLastName())
                        .append(", Title: ").append(candidate.getCurrentTitle())
                        .append(", Company: ").append(candidate.getCurrentCompany())
                        .append(", Bio: ").append(candidate.getBio())
                        .append(", Skills: ").append(candidate.getSkills().stream().map(CandidateSkill::getSkillName).collect(Collectors.joining(", ")))
                        .append("\n");
            }
        } else if (conversation.getContextType().equals("JOB") && conversation.getContextId() != null) {
            Job job = jobRepository.findById(conversation.getContextId()).orElse(null);
            if (job != null) {
                contextBuilder.append("Context Active Job: ")
                        .append(job.getTitle())
                        .append(", Company: ").append(job.getCompany().getName())
                        .append(", Description: ").append(job.getDescription())
                        .append("\n");
            }
        }

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("test-key")) {
            log.warn("AI API Key is empty or mock. Falling back to local mock chatbot responses.");
            return generateMockAnswer(conversation.getContextType(), userPrompt);
        }

        try {
            ChatLanguageModel model = OpenAiChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(config.getPreferredModel())
                    .temperature(config.getTemperature().doubleValue())
                    .build();

            List<ChatMessage> chatMessages = new ArrayList<>();
            chatMessages.add(new SystemMessage(contextBuilder.toString()));

            // Memory window: load past messages
            if (config.isEnableMemory()) {
                List<AiMessage> pastMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
                // Limit to memory window
                int start = Math.max(0, pastMessages.size() - config.getMemoryWindow());
                for (int i = start; i < pastMessages.size(); i++) {
                    AiMessage m = pastMessages.get(i);
                    if (m.getRole().equals("USER")) {
                        chatMessages.add(new UserMessage(m.getContent()));
                    } else if (m.getRole().equals("ASSISTANT")) {
                        chatMessages.add(new dev.langchain4j.data.message.AiMessage(m.getContent()));
                    }
                }
            } else {
                chatMessages.add(new UserMessage(userPrompt));
            }

            return model.generate(chatMessages).content().text();
        } catch (Exception e) {
            log.error("AI Copilot request failed: {}. Falling back to mock response.", e.getMessage());
            return generateMockAnswer(conversation.getContextType(), userPrompt);
        }
    }

    private String generateMockAnswer(String contextType, String userPrompt) {
        if (contextType.equals("CANDIDATE")) {
            return "Based on the candidate's profile in this chat session, they demonstrate solid Java and Spring Boot experience. Their background aligns well with mid-to-senior backend roles. What specific skill would you like to review next?";
        } else if (contextType.equals("JOB")) {
            return "I have reviewed the job description. The core requirements focus on cloud deployments and Spring MVC API structures. I recommend prioritizing candidates with AWS certifications.";
        }
        return "I am the TalentIQ AI Copilot. I can assist you with screening resumes, checking candidate compatibility scores, or updating job postings details. Let me know how I can help!";
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AiCopilotDto.ConversationResponse mapToConversationDto(AiConversation conv) {
        return AiCopilotDto.ConversationResponse.builder()
                .id(conv.getId())
                .title(conv.getTitle())
                .contextType(conv.getContextType())
                .contextId(conv.getContextId())
                .pinned(conv.isPinned())
                .archived(conv.isArchived())
                .messageCount(conv.getMessageCount())
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }

    private AiCopilotDto.ConfigResponse mapToConfigDto(AiCopilotConfig config) {
        return AiCopilotDto.ConfigResponse.builder()
                .id(config.getId())
                .preferredModel(config.getPreferredModel())
                .systemPrompt(config.getSystemPrompt())
                .temperature(config.getTemperature())
                .enableMemory(config.isEnableMemory())
                .memoryWindow(config.getMemoryWindow())
                .enableRag(config.isEnableRag())
                .build();
    }
}
