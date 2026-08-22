package com.talentiq.service.auth;

import com.talentiq.common.enums.Role;
import com.talentiq.common.enums.UserStatus;
import com.talentiq.common.exception.BadRequestException;
import com.talentiq.common.exception.ConflictException;
import com.talentiq.common.exception.UnauthorizedException;
import com.talentiq.config.AppProperties;
import com.talentiq.infrastructure.mail.MailService;
import com.talentiq.dto.auth.*;
import com.talentiq.model.RefreshToken;
import com.talentiq.repository.auth.RefreshTokenRepository;
import com.talentiq.model.User;
import com.talentiq.repository.user.UserRepository;
import com.talentiq.security.jwt.JwtService;
import com.talentiq.security.userdetails.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * Unit tests for AuthServiceImpl.
 * Uses Mockito to isolate the service from its dependencies.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthService Unit Tests")
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private MailService mailService;
    @Mock private AppProperties appProperties;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthServiceImpl authService;

    private AppProperties.JwtProperties jwtProps;
    private AppProperties.MailProperties mailProps;
    private AppProperties.FrontendProperties frontendProps;

    @BeforeEach
    void setUp() {
        jwtProps = new AppProperties.JwtProperties();
        jwtProps.setSecret("test-secret");
        jwtProps.setAccessTokenExpiryMs(900_000L);
        jwtProps.setRefreshTokenExpiryDays(7);

        mailProps = new AppProperties.MailProperties();
        mailProps.setVerificationExpiryMinutes(30);
        mailProps.setResetPasswordExpiryMinutes(15);

        frontendProps = new AppProperties.FrontendProperties();
        frontendProps.setBaseUrl("http://localhost:3000");

        when(appProperties.getJwt()).thenReturn(jwtProps);
        when(appProperties.getMail()).thenReturn(mailProps);
        when(appProperties.getFrontend()).thenReturn(frontendProps);
    }

    // ── Register Tests ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Register")
    class RegisterTests {

        @Test
        @DisplayName("should register candidate successfully")
        void shouldRegisterCandidateSuccessfully() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setFirstName("John");
            request.setLastName("Doe");
            request.setEmail("john.doe@example.com");
            request.setPassword("Secure@123");
            request.setRole(Role.ROLE_CANDIDATE);

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$hashed$");

            // Capture the User passed to save() and return it (preserving the generated token)
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User userToSave = invocation.getArgument(0);
                userToSave = User.builder()
                        .id(1L)
                        .email(userToSave.getEmail())
                        .firstName(userToSave.getFirstName())
                        .lastName(userToSave.getLastName())
                        .roles(userToSave.getRoles())
                        .emailVerified(false)
                        .status(UserStatus.PENDING_VERIFICATION)
                        .emailVerificationToken(userToSave.getEmailVerificationToken())
                        .build();
                return userToSave;
            });

            // When
            AuthResponse response = authService.register(request, httpRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("john.doe@example.com");
            assertThat(response.isEmailVerified()).isFalse();
            assertThat(response.getAccessToken()).isNull(); // No token until verified

            verify(userRepository).existsByEmail("john.doe@example.com");
            verify(userRepository).save(any(User.class));
            verify(mailService).sendEmailVerification(anyString(), anyString(), notNull());
        }

        @Test
        @DisplayName("should throw ConflictException when email already exists")
        void shouldThrowConflictWhenEmailExists() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("existing@example.com");
            request.setRole(Role.ROLE_CANDIDATE);

            when(userRepository.existsByEmail(anyString())).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request, httpRequest))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already exists");

            verify(userRepository, never()).save(any());
            verify(mailService, never()).sendEmailVerification(any(), any(), any());
        }

        @Test
        @DisplayName("should reject admin role on public registration")
        void shouldRejectAdminRoleOnRegistration() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("admin@example.com");
            request.setRole(Role.ROLE_SUPER_ADMIN);

            assertThatThrownBy(() -> authService.register(request, httpRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("CANDIDATE and HR");

            verify(userRepository, never()).existsByEmail(any());
        }
    }

    // ── Login Tests ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("should login successfully and return tokens")
        void shouldLoginSuccessfully() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("john@example.com");
            request.setPassword("Secure@123");

            User user = User.builder()
                    .id(1L)
                    .email("john@example.com")
                    .firstName("John")
                    .lastName("Doe")
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .roles(Set.of(Role.ROLE_CANDIDATE))
                    .build();

            UserPrincipal principal = new UserPrincipal(user);
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
            when(authenticationManager.authenticate(any())).thenReturn(authToken);
            when(jwtService.generateAccessToken(any(), anyLong())).thenReturn("access-token-xyz");

            RefreshToken refreshToken = RefreshToken.builder()
                    .id(1L)
                    .token("refresh-token-xyz")
                    .user(user)
                    .expiresAt(Instant.now().plusSeconds(604800))
                    .build();
            when(refreshTokenRepository.save(any())).thenReturn(refreshToken);

            // When
            AuthResponse response = authService.login(request, httpRequest);

            // Then
            assertThat(response.getAccessToken()).isEqualTo("access-token-xyz");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token-xyz");
            assertThat(response.getEmail()).isEqualTo("john@example.com");

            verify(userRepository).recordSuccessfulLogin(eq(1L), any(Instant.class));
        }

        @Test
        @DisplayName("should throw UnauthorizedException for locked account")
        void shouldThrowForLockedAccount() {
            LoginRequest request = new LoginRequest();
            request.setEmail("locked@example.com");
            request.setPassword("any");

            User lockedUser = User.builder()
                    .id(2L)
                    .email("locked@example.com")
                    .lockedUntil(Instant.now().plusSeconds(600))
                    .build();

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(lockedUser));

            assertThatThrownBy(() -> authService.login(request, httpRequest))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("locked");

            verify(authenticationManager, never()).authenticate(any());
        }

        @Test
        @DisplayName("should increment failed attempts on bad credentials")
        void shouldIncrementFailedAttemptsOnBadCredentials() {
            LoginRequest request = new LoginRequest();
            request.setEmail("user@example.com");
            request.setPassword("wrong");

            User user = User.builder()
                    .id(3L)
                    .email("user@example.com")
                    .loginAttempts(2)
                    .build();

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(request, httpRequest))
                    .isInstanceOf(BadCredentialsException.class);

            verify(userRepository).incrementLoginAttempts(3L);
        }
    }

    // ── Refresh Token Tests ───────────────────────────────────────────────────

    @Nested
    @DisplayName("Refresh Token")
    class RefreshTokenTests {

        @Test
        @DisplayName("should rotate refresh token successfully")
        void shouldRotateRefreshTokenSuccessfully() {
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("old-refresh-token");

            User user = User.builder()
                    .id(1L)
                    .email("john@example.com")
                    .firstName("John")
                    .lastName("Doe")
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .roles(Set.of(Role.ROLE_CANDIDATE))
                    .build();

            RefreshToken existingToken = RefreshToken.builder()
                    .id(1L)
                    .token("old-refresh-token")
                    .user(user)
                    .expiresAt(Instant.now().plusSeconds(86400))
                    .revoked(false)
                    .build();

            when(refreshTokenRepository.findByToken("old-refresh-token"))
                    .thenReturn(Optional.of(existingToken));
            when(jwtService.generateAccessToken(any(), anyLong())).thenReturn("new-access-token");

            RefreshToken newRefreshToken = RefreshToken.builder()
                    .id(2L)
                    .token("new-refresh-token")
                    .user(user)
                    .expiresAt(Instant.now().plusSeconds(604800))
                    .build();
            when(refreshTokenRepository.save(any())).thenReturn(newRefreshToken);

            AuthResponse response = authService.refreshToken(request, httpRequest);

            assertThat(response.getAccessToken()).isEqualTo("new-access-token");
            assertThat(response.getRefreshToken()).isEqualTo("new-refresh-token");
            verify(refreshTokenRepository).revokeByToken("old-refresh-token");
        }

        @Test
        @DisplayName("should revoke all tokens when expired token is presented (theft detection)")
        void shouldRevokeAllTokensOnExpiredToken() {
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("expired-token");

            User user = User.builder().id(1L).build();
            RefreshToken expiredToken = RefreshToken.builder()
                    .id(1L)
                    .token("expired-token")
                    .user(user)
                    .expiresAt(Instant.now().minusSeconds(3600)) // expired
                    .revoked(false)
                    .build();

            when(refreshTokenRepository.findByToken("expired-token"))
                    .thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> authService.refreshToken(request, httpRequest))
                    .isInstanceOf(UnauthorizedException.class);

            verify(refreshTokenRepository).revokeAllUserTokens(1L);
        }
    }

    // ── Email Verification Tests ──────────────────────────────────────────────

    @Nested
    @DisplayName("Email Verification")
    class EmailVerificationTests {

        @Test
        @DisplayName("should verify email with valid token")
        void shouldVerifyEmailWithValidToken() {
            VerifyEmailRequest request = new VerifyEmailRequest();
            request.setToken("valid-token-123");

            User user = User.builder()
                    .id(1L)
                    .email("user@example.com")
                    .firstName("John")
                    .emailVerified(false)
                    .emailVerificationToken("valid-token-123")
                    .emailVerificationTokenExpiresAt(Instant.now().plusSeconds(1800))
                    .build();

            when(userRepository.findByEmailVerificationToken("valid-token-123"))
                    .thenReturn(Optional.of(user));

            authService.verifyEmail(request);

            verify(userRepository).verifyEmail(1L);
            verify(mailService).sendWelcomeEmail(eq("user@example.com"), eq("John"));
        }

        @Test
        @DisplayName("should throw BadRequestException for expired token")
        void shouldThrowForExpiredToken() {
            VerifyEmailRequest request = new VerifyEmailRequest();
            request.setToken("expired-token");

            User user = User.builder()
                    .id(1L)
                    .emailVerified(false)
                    .emailVerificationTokenExpiresAt(Instant.now().minusSeconds(3600)) // expired
                    .build();

            when(userRepository.findByEmailVerificationToken("expired-token"))
                    .thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.verifyEmail(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("expired");
        }
    }

    // ── Password Reset Tests ──────────────────────────────────────────────────

    @Nested
    @DisplayName("Password Reset")
    class PasswordResetTests {

        @Test
        @DisplayName("forgotPassword should not reveal whether email exists")
        void forgotPasswordShouldNotRevealEmailExistence() {
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("nonexistent@example.com");

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

            // Should NOT throw — always returns success
            assertThatCode(() -> authService.forgotPassword(request))
                    .doesNotThrowAnyException();

            verify(mailService, never()).sendPasswordResetEmail(any(), any(), any());
        }

        @Test
        @DisplayName("should reset password and revoke all tokens")
        void shouldResetPasswordAndRevokeAllTokens() {
            ResetPasswordRequest request = new ResetPasswordRequest();
            request.setToken("valid-reset-token");
            request.setNewPassword("NewSecure@456");

            User user = User.builder()
                    .id(1L)
                    .email("user@example.com")
                    .passwordResetToken("valid-reset-token")
                    .passwordResetTokenExpiresAt(Instant.now().plusSeconds(900))
                    .build();

            when(userRepository.findByPasswordResetToken("valid-reset-token"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.encode("NewSecure@456")).thenReturn("$new-hash$");

            authService.resetPassword(request);

            verify(userRepository).updatePassword(1L, "$new-hash$");
            verify(refreshTokenRepository).revokeAllUserTokens(1L);
        }
    }
}
