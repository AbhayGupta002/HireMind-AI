package com.talentiq.common.enums;

/**
 * User roles for RBAC.
 * Stored in user_roles table.
 * Prefixed with ROLE_ for Spring Security compatibility.
 */
public enum Role {
    ROLE_GUEST,
    ROLE_CANDIDATE,
    ROLE_HR,
    ROLE_COMPANY_ADMIN,
    ROLE_PLATFORM_ADMIN,
    ROLE_SUPER_ADMIN
}
