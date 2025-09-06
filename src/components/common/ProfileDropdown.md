# ProfileDropdown Component - Enhanced UX

An improved user profile dropdown component with smart email handling and better mobile responsiveness.

## Key Improvements

### 1. **Smart Email Display**

- **Long emails are intelligently truncated** instead of showing the full email
- **Username@domain format** for better readability
- **Hover tooltip** shows the complete email address
- **Responsive truncation** based on available space

### 2. **Role Badges**

- **Visual role indicators** (Admin, Seller, Super Admin)
- **Color-coded badges** with appropriate Bootstrap colors
- **Icons for each role** for better visual recognition
- **Priority-based display** (Super Admin > Admin > Seller)

### 3. **Enhanced Dropdown Header**

- **User avatar** prominently displayed
- **Full name** shown in dropdown (vs. first name in header)
- **Better information hierarchy** with proper spacing
- **Improved visual design** with better contrast

### 4. **Responsive Design**

- **Mobile-first approach** with progressive enhancement
- **Adaptive text truncation** based on screen size
- **Hidden elements** on very small screens (< 410px)
- **Flexible width constraints** for different viewports

## Email Truncation Strategies

### Strategy 1: Username + Domain (Preferred)

```
Original: verylongusername@verylongdomain.com
Display:  verylongu...@...domain.com
```

### Strategy 2: Simple Truncation (Fallback)

```
Original: verylongusername@domain.com
Display:  verylongusername...
```

## Usage Examples

### Basic Usage

```jsx
import ProfileDropdown from "@/components/common/ProfileDropdown";

<ProfileDropdown user={session.user} />;
```

### With Custom Styling

```jsx
<div className="d-flex align-items-center">
  <ProfileDropdown user={session.user} />
</div>
```

## User Display Information

The component uses utility functions from `@/utils/userDisplayUtils` for consistent user information display:

### Header Display (Compact)

- **Name**: First name only
- **Email**: Truncated to ~18 characters
- **Role Badge**: Small pill badge

### Dropdown Display (Full)

- **Name**: Full name
- **Email**: Truncated to ~25 characters
- **Role Badge**: With icon and full text

## Role Badge Colors

| Role        | Color  | Bootstrap Class | Icon               |
| ----------- | ------ | --------------- | ------------------ |
| Super Admin | Red    | `bg-danger`     | `ti-crown`         |
| Admin       | Yellow | `bg-warning`    | `ti-settings`      |
| Seller      | Green  | `bg-success`    | `ti-shopping-cart` |

## Responsive Breakpoints

| Screen Size | Max Width | Behavior                       |
| ----------- | --------- | ------------------------------ |
| < 410px     | Hidden    | Profile text completely hidden |
| 410-576px   | 100px     | Very compact display           |
| 576-768px   | 120px     | Compact display                |
| 768px+      | 140px     | Full display                   |

## Accessibility Features

- **Keyboard navigation** support
- **Screen reader friendly** with proper ARIA labels
- **High contrast** role badges
- **Tooltip support** for truncated text
- **Focus management** for dropdown interactions

## Technical Implementation

### Utility Functions

- `getUserDisplayInfo()` - Smart email truncation
- `getRoleBadge()` - Role badge configuration
- `getUserStatusIndicators()` - Status indicators (future)

### CSS Classes

- `.user-name` - Profile text container
- `.dropdown-toggle` - Custom toggle styling
- `.badge` - Role badge styling

## Future Enhancements

- **Online status indicators**
- **Last seen timestamps**
- **Email verification badges**
- **Custom user status messages**
- **Profile completion indicators**

## Browser Support

- **Modern browsers** (Chrome 90+, Firefox 88+, Safari 14+)
- **Mobile browsers** with proper touch support
- **Responsive design** works on all screen sizes
- **Progressive enhancement** for older browsers
