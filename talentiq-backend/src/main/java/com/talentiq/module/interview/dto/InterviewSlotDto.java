package com.talentiq.module.interview.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

public class InterviewSlotDto {

    /** Request to schedule a new interview slot */
    @Data
    public static class ScheduleRequest {
        @NotNull(message = "Application ID is required")
        private Long applicationId;

        @NotNull(message = "Scheduled time is required")
        @Future(message = "Interview must be scheduled in the future")
        private Instant scheduledAt;

        @Min(value = 15, message = "Duration must be at least 15 minutes")
        private int durationMinutes = 60;

        private String meetingLink;
        private String notes;
    }

    /** Request to send a "You are selected" email to a candidate */
    @Data
    public static class SelectionEmailRequest {
        @NotNull(message = "Application ID is required")
        private Long applicationId;

        private String customMessage;
    }

    /** Update an interview slot's status */
    @Data
    public static class StatusUpdateRequest {
        @NotNull(message = "Status is required")
        private String status; // CONFIRMED | CANCELLED
    }

    /** Full interview slot details returned to HR calendar */
    @Data
    @Builder
    public static class Response {
        private Long id;
        private Long applicationId;
        private Long hrUserId;
        private String hrName;
        private Long candidateUserId;
        private String candidateName;
        private String candidateEmail;
        private String jobTitle;
        private Instant scheduledAt;
        private int durationMinutes;
        private String meetingLink;
        private String notes;
        private String status;
        private boolean reminderSent;
        private Instant createdAt;
    }
}
