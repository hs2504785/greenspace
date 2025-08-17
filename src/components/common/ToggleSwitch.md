# 🔄 ToggleSwitch Component

A reusable, customizable toggle switch component that fixes Bootstrap's switch styling issues and provides consistent behavior across the application.

## ✨ Features

- ✅ **Clean, modern design** - No more rectangular Bootstrap switch issues
- ✅ **Fully customizable** - Multiple sizes and color variants
- ✅ **Responsive** - Optimized for mobile and desktop
- ✅ **Accessible** - Proper focus states and ARIA support
- ✅ **Smooth animations** - Professional slide transitions
- ✅ **Consistent styling** - Works the same everywhere

## 🚀 Basic Usage

```jsx
import ToggleSwitch from "@/components/common/ToggleSwitch";

function MyComponent() {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <ToggleSwitch
      id="notifications"
      label="Enable notifications"
      checked={isEnabled}
      onChange={setIsEnabled}
    />
  );
}
```

## 📋 Props

| Prop        | Type     | Default     | Description                                   |
| ----------- | -------- | ----------- | --------------------------------------------- |
| `id`        | string   | required    | Unique identifier for the switch              |
| `label`     | string   | required    | Label text displayed next to the switch       |
| `checked`   | boolean  | `false`     | Whether the switch is in the on position      |
| `onChange`  | function | -           | Callback fired when switch state changes      |
| `disabled`  | boolean  | `false`     | Whether the switch is disabled                |
| `size`      | string   | `"md"`      | Size variant: `"sm"`, `"md"`, `"lg"`          |
| `variant`   | string   | `"success"` | Color variant: `"primary"`, `"success"`, etc. |
| `className` | string   | `""`        | Additional CSS classes                        |
| `style`     | object   | `{}`        | Additional inline styles                      |

## 🎨 Size Variants

```jsx
{
  /* Small */
}
<ToggleSwitch
  id="small-switch"
  label="Small switch"
  size="sm"
  checked={value}
  onChange={setValue}
/>;

{
  /* Medium (default) */
}
<ToggleSwitch
  id="medium-switch"
  label="Medium switch"
  checked={value}
  onChange={setValue}
/>;

{
  /* Large */
}
<ToggleSwitch
  id="large-switch"
  label="Large switch"
  size="lg"
  checked={value}
  onChange={setValue}
/>;
```

## 🌈 Color Variants

```jsx
{
  /* Success (default) */
}
<ToggleSwitch
  id="success-switch"
  label="Success switch"
  variant="success"
  checked={value}
  onChange={setValue}
/>;

{
  /* Primary */
}
<ToggleSwitch
  id="primary-switch"
  label="Primary switch"
  variant="primary"
  checked={value}
  onChange={setValue}
/>;

{
  /* Danger */
}
<ToggleSwitch
  id="danger-switch"
  label="Danger switch"
  variant="danger"
  checked={value}
  onChange={setValue}
/>;

{
  /* Warning */
}
<ToggleSwitch
  id="warning-switch"
  label="Warning switch"
  variant="warning"
  checked={value}
  onChange={setValue}
/>;

{
  /* Info */
}
<ToggleSwitch
  id="info-switch"
  label="Info switch"
  variant="info"
  checked={value}
  onChange={setValue}
/>;
```

## ♿ Accessibility

The component includes proper accessibility features:

- **Keyboard navigation** - Can be toggled with space/enter keys
- **Focus indicators** - Clear visual focus states
- **Screen reader support** - Proper labeling and state announcements
- **Touch-friendly** - Optimized touch targets on mobile devices

## 🎯 Real-world Examples

### Settings Toggle

```jsx
<ToggleSwitch
  id="email-notifications"
  label="📧 Email notifications"
  checked={settings.emailNotifications}
  onChange={(checked) => updateSettings({ emailNotifications: checked })}
  variant="primary"
/>
```

### Feature Flag

```jsx
<ToggleSwitch
  id="dark-mode"
  label="🌙 Dark mode"
  checked={theme === "dark"}
  onChange={(checked) => setTheme(checked ? "dark" : "light")}
  variant="info"
/>
```

### Filter Option

```jsx
<ToggleSwitch
  id="show-free-only"
  label="🎁 Fair Share (Free items only)"
  checked={filters.showFreeOnly}
  onChange={(checked) => updateFilters({ showFreeOnly: checked })}
  variant="success"
/>
```

## 🔧 Technical Details

### Styling Fixes

- Removes Bootstrap's problematic background-image
- Implements custom track and thumb styling
- Ensures proper circular thumb shape (not rectangular)
- Smooth slide animations with CSS transitions

### Performance

- Memoized event handlers for optimal re-rendering
- Lightweight CSS with minimal specificity conflicts
- Mobile-optimized touch targets

### Browser Support

- Modern browsers with CSS custom properties support
- Graceful fallback for older browsers
- Touch device optimizations

## 📱 Mobile Considerations

- **Larger touch targets** on mobile devices
- **Optimized spacing** for thumb interaction
- **Smooth animations** that work well on touch
- **Responsive sizing** that scales appropriately

## 🎨 Customization

The component can be further customized with CSS custom properties:

```css
.custom-toggle-switch {
  --toggle-width: 3rem;
  --toggle-height: 1.5rem;
  --toggle-thumb-size: 1.25rem;
  --toggle-border-radius: 1.5rem;
}
```

This ToggleSwitch component provides a **professional, consistent, and accessible** toggle experience that works great across all devices and use cases!
