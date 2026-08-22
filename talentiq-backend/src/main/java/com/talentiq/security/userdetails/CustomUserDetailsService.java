package com.talentiq.security.userdetails;

import com.talentiq.model.User;
import com.talentiq.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.talentiq.common.constants.AppConstants.CACHE_USER;

/**
 * Spring Security UserDetailsService implementation.
 * Loads user by email (used as username across the platform).
 * Caches results to avoid repeated DB hits on every request.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));
        return new UserPrincipal(user);
    }

    /**
     * Load user by ID — used internally after JWT extraction.
     * Cached to reduce load.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_USER, key = "#userId", unless = "#result == null")
    public UserPrincipal loadUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with id: " + userId));
        return new UserPrincipal(user);
    }
}
