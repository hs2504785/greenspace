/**
 * Utility functions for displaying user information in a user-friendly way
 */

/**
 * Get user display information with smart email truncation
 * @param {Object} user - User object with name and email
 * @param {Object} options - Display options
 * @returns {Object} Display information with name and subtitle
 */
export function getUserDisplayInfo(user, options = {}) {
  const {
    maxEmailLength = 20,
    showDomain = true,
    showFullNameInDropdown = false,
  } = options;

  if (!user) return { name: "User", subtitle: "", fullName: "User" };

  // Get display name (first name for header, full name for dropdown)
  const fullName = user.name || "User";
  const firstName = fullName.split(" ")[0] || "User";
  const displayName = showFullNameInDropdown ? fullName : firstName;

  // Handle email display
  let subtitle = "";
  if (user.email) {
    const email = user.email;

    if (email.length <= maxEmailLength) {
      subtitle = email;
    } else {
      // Smart truncation strategies
      const [username, domain] = email.split("@");

      if (username && domain && showDomain) {
        // Strategy 1: Show truncated username + domain
        const maxUsernameLength = Math.floor(maxEmailLength * 0.6);
        const maxDomainLength = maxEmailLength - maxUsernameLength - 1; // -1 for @

        const shortUsername =
          username.length > maxUsernameLength
            ? username.substring(0, maxUsernameLength - 3) + "..."
            : username;

        const shortDomain =
          domain.length > maxDomainLength
            ? "..." + domain.slice(-(maxDomainLength - 3))
            : domain;

        subtitle = `${shortUsername}@${shortDomain}`;
      } else {
        // Strategy 2: Simple truncation
        subtitle = email.substring(0, maxEmailLength - 3) + "...";
      }
    }
  }

  return {
    name: displayName,
    subtitle,
    fullName,
    email: user.email,
  };
}

/**
 * Get role badge information
 * @param {Object} roleInfo - Role information from useUserRole hook
 * @returns {Object|null} Badge information or null
 */
export function getRoleBadge(roleInfo) {
  const { isSeller, isAdmin, isSuperAdmin, loading } = roleInfo;

  if (loading) return null;

  if (isSuperAdmin) {
    return {
      text: "Super Admin",
      color: "danger",
      icon: "ti-crown",
      priority: 4,
    };
  }

  if (isAdmin) {
    return {
      text: "Admin",
      color: "warning",
      icon: "ti-settings",
      priority: 3,
    };
  }

  if (isSeller) {
    return {
      text: "Seller",
      color: "success",
      icon: "ti-shopping-cart",
      priority: 2,
    };
  }

  return null;
}

/**
 * Get user status indicators (online, verified, etc.)
 * @param {Object} user - User object
 * @returns {Array} Array of status indicators
 */
export function getUserStatusIndicators(user) {
  const indicators = [];

  if (user?.emailVerified) {
    indicators.push({
      icon: "ti-check",
      color: "success",
      tooltip: "Email verified",
      priority: 1,
    });
  }

  if (user?.isActive === false) {
    indicators.push({
      icon: "ti-alert-circle",
      color: "warning",
      tooltip: "Account inactive",
      priority: 3,
    });
  }

  return indicators.sort((a, b) => (a.priority || 0) - (b.priority || 0));
}

/**
 * Format user's last seen or join date
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatUserDate(date) {
  if (!date) return "";

  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return dateObj.toLocaleDateString();
}
