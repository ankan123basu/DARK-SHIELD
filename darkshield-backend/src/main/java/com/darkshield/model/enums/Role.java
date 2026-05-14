package com.darkshield.model.enums;

/**
 * User roles for role-based access control in the SOC platform.
 * ANALYST: Can view and report threats
 * HUNTER: Can investigate, escalate, and resolve incidents
 * ADMIN: Full system access including user management
 */
public enum Role {
    ROLE_ANALYST,
    ROLE_HUNTER,
    ROLE_ADMIN
}
