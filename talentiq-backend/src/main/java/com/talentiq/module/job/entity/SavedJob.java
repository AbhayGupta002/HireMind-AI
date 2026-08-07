package com.talentiq.module.job.entity;

import com.talentiq.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "saved_jobs",
        uniqueConstraints = @UniqueConstraint(name = "uk_saved_jobs_user_job", columnNames = {"user_id", "job_id"}),
        indexes = {
                @Index(name = "idx_saved_jobs_user_id", columnList = "user_id"),
                @Index(name = "idx_saved_jobs_job_id", columnList = "job_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
