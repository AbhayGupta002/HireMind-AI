-- ============================================================
-- V12: Performance Optimization Indexes
-- Adds composite and covering indexes for common query patterns
-- ============================================================

-- ── 1. Jobs Table Optimization ──────────────────────────────────
-- Optimizes active job feed query: status + expires_at + created_at
CREATE INDEX idx_jobs_status_expires_created 
    ON jobs (status, expires_at, created_at);

-- Optimizes company job management / dashboard filtering
CREATE INDEX idx_jobs_company_status 
    ON jobs (company_id, status);

-- ── 2. Job Applications Optimization ───────────────────────────
-- Optimizes recruiter applicant sorting by AI score & status for a job
CREATE INDEX idx_job_apps_job_status_score 
    ON job_applications (job_id, status, ai_match_score);

-- Optimizes candidate application history ordered by application date
CREATE INDEX idx_job_apps_candidate_applied 
    ON job_applications (candidate_id, applied_at);

-- ── 3. Candidate & Skills Optimization ──────────────────────────
-- Optimizes open-to-work candidate directory sorted by newest
CREATE INDEX idx_candidates_open_to_work_created 
    ON candidates (is_open_to_work, created_at);

-- Optimizes primary skills lookup per candidate
CREATE INDEX idx_candidate_skills_cand_primary 
    ON candidate_skills (candidate_id, is_primary);

-- ── 4. Notifications & User Activity ────────────────────────────
-- Optimizes unread notification badge counts & user notification feed
CREATE INDEX idx_notifications_user_read_created 
    ON notifications (user_id, is_read, created_at);

-- Optimizes active token lookups & bulk revocation per user
CREATE INDEX idx_refresh_tokens_user_revoked 
    ON refresh_tokens (user_id, revoked);

-- Optimizes active resume lookup for candidate profile & application flows
CREATE INDEX idx_resumes_candidate_active 
    ON resumes (candidate_id, is_active);

-- ── 5. Analytics & Audit Logging ───────────────────────────────
-- Optimizes metric aggregations by event type across time ranges
CREATE INDEX idx_analytics_events_type_created 
    ON analytics_events (event_type, created_at);

-- Optimizes user audit trail and security history lookups
CREATE INDEX idx_audit_logs_user_created 
    ON audit_logs (user_id, created_at);

-- ── 6. Chat & Interview Scheduling ──────────────────────────────
-- Optimizes direct messaging thread queries between two users
CREATE INDEX idx_chat_msg_pair_sent 
    ON chat_messages (sender_id, receiver_id, sent_at);

-- Optimizes HR interview scheduling & calendar timeline lookups
CREATE INDEX idx_interview_hr_status_scheduled 
    ON interview_slots (hr_user_id, status, scheduled_at);
