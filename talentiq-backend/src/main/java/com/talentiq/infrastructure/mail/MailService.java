package com.talentiq.infrastructure.mail;

import com.talentiq.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Mail service for transactional emails.
 * All sends are @Async — fire-and-forget on the mail thread pool.
 * Failures are logged but do not bubble up to the calling request.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    /**
     * Sends the email verification email.
     */
    @Async("mailExecutor")
    public void sendEmailVerification(String toEmail, String firstName, String verificationToken) {
        String verificationUrl = appProperties.getFrontend().getBaseUrl()
                + "/verify-email?token=" + verificationToken;

        String subject = "Verify your TalentIQ email address";
        String body = buildEmailVerificationHtml(firstName, verificationUrl,
                appProperties.getMail().getVerificationExpiryMinutes());

        sendHtmlEmail(toEmail, subject, body);
        log.info("Verification email dispatched to: {}", toEmail);
    }

    /**
     * Sends the password reset email.
     */
    @Async("mailExecutor")
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetToken) {
        String resetUrl = appProperties.getFrontend().getBaseUrl()
                + "/reset-password?token=" + resetToken;

        String subject = "Reset your TalentIQ password";
        String body = buildPasswordResetHtml(firstName, resetUrl,
                appProperties.getMail().getResetPasswordExpiryMinutes());

        sendHtmlEmail(toEmail, subject, body);
        log.info("Password reset email dispatched to: {}", toEmail);
    }

    /**
     * Sends a welcome email after successful email verification.
     */
    @Async("mailExecutor")
    public void sendWelcomeEmail(String toEmail, String firstName) {
        String subject = "Welcome to TalentIQ — Your AI Career Platform";
        String body = buildWelcomeHtml(firstName, appProperties.getFrontend().getBaseUrl());
        sendHtmlEmail(toEmail, subject, body);
        log.info("Welcome email dispatched to: {}", toEmail);
    }

    /**
     * Sends a generic system alert notification.
     */
    @Async("mailExecutor")
    public void sendSystemAlert(String toEmail, String alertTitle, String alertMessage) {
        String subject = "TalentIQ Notification: " + alertTitle;
        String body = buildAlertHtml(alertTitle, alertMessage);
        sendHtmlEmail(toEmail, subject, body);
        log.info("System alert email dispatched to: {}", toEmail);
    }

    // ── Core Send ─────────────────────────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(
                    appProperties.getMail().getFrom(),
                    appProperties.getMail().getFromName()
            );
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage(), e);
        }
    }

    // ── HTML Templates ────────────────────────────────────────────────────────

    private String buildEmailVerificationHtml(String firstName, String verificationUrl, int expiryMinutes) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title></head>
                <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f172a;">
                <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
                <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 30px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">TalentIQ</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">AI Talent Intelligence Platform</p>
                </td></tr>
                <tr><td style="padding:40px;">
                  <h2 style="color:#f8fafc;margin:0 0 16px;font-size:22px;">Hello, %s! 👋</h2>
                  <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;">
                    Welcome to TalentIQ! Please verify your email address to activate your account and unlock all features.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">
                      Verify Email Address
                    </a>
                  </div>
                  <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 8px;">
                    This link expires in <strong style="color:#94a3b8;">%d minutes</strong>.
                  </p>
                  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </td></tr>
                <tr><td style="padding:24px 40px;border-top:1px solid #334155;text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0;">© 2025 TalentIQ · AI Talent Intelligence Platform</p>
                </td></tr>
                </table></td></tr></table>
                </body></html>
                """.formatted(firstName, verificationUrl, expiryMinutes);
    }

    private String buildPasswordResetHtml(String firstName, String resetUrl, int expiryMinutes) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><title>Reset Your Password</title></head>
                <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f172a;">
                <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
                <tr><td style="background:linear-gradient(135deg,#ef4444,#f97316);padding:40px 40px 30px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">TalentIQ</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Password Reset Request</p>
                </td></tr>
                <tr><td style="padding:40px;">
                  <h2 style="color:#f8fafc;margin:0 0 16px;font-size:22px;">Hi %s,</h2>
                  <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;">
                    We received a request to reset your password. Click the button below to set a new password.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">
                      Reset My Password
                    </a>
                  </div>
                  <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 8px;">
                    This link expires in <strong style="color:#94a3b8;">%d minutes</strong>.
                  </p>
                  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
                    If you didn't request a password reset, please secure your account immediately.
                  </p>
                </td></tr>
                <tr><td style="padding:24px 40px;border-top:1px solid #334155;text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0;">© 2025 TalentIQ · AI Talent Intelligence Platform</p>
                </td></tr>
                </table></td></tr></table>
                </body></html>
                """.formatted(firstName, resetUrl, expiryMinutes);
    }

    private String buildWelcomeHtml(String firstName, String dashboardUrl) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><title>Welcome to TalentIQ</title></head>
                <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f172a;">
                <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
                <tr><td style="background:linear-gradient(135deg,#06b6d4,#6366f1,#8b5cf6);padding:40px 40px 30px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">Welcome to TalentIQ! 🚀</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:15px;">Your AI-Powered Career Journey Starts Now</p>
                </td></tr>
                <tr><td style="padding:40px;">
                  <h2 style="color:#f8fafc;margin:0 0 16px;font-size:22px;">Hello, %s! Your account is ready.</h2>
                  <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;">
                    You now have access to the complete AI Talent Intelligence Platform — portfolio builder,
                    AI resume parser, smart job matching, and more.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="%s/dashboard" style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#6366f1);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">
                      Go to Dashboard
                    </a>
                  </div>
                </td></tr>
                <tr><td style="padding:24px 40px;border-top:1px solid #334155;text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0;">© 2025 TalentIQ · AI Talent Intelligence Platform</p>
                </td></tr>
                </table></td></tr></table>
                </body></html>
                """.formatted(firstName, dashboardUrl);
    }

    private String buildAlertHtml(String title, String message) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><title>%s</title></head>
                <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f172a;">
                <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
                <tr><td style="background:linear-gradient(135deg,#06b6d4,#6366f1);padding:30px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">%s</h1>
                </td></tr>
                <tr><td style="padding:40px;">
                  <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;font-size:16px;">%s</p>
                </td></tr>
                <tr><td style="padding:24px 40px;border-top:1px solid #334155;text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0;">© 2025 TalentIQ · AI Talent Intelligence Platform</p>
                </td></tr>
                </table></td></tr></table>
                </body></html>
                """.formatted(title, title, message);
    }
}
