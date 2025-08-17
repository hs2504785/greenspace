"use client";

import { Form } from "react-bootstrap";
import "./ToggleSwitch.css";

/**
 * Reusable Toggle Switch component with consistent styling
 *
 * @param {string} id - Unique identifier for the switch
 * @param {string} label - Label text for the switch
 * @param {boolean} checked - Whether the switch is checked
 * @param {function} onChange - Handler for switch state changes
 * @param {boolean} disabled - Whether the switch is disabled
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {string} variant - Color variant ('primary', 'success', 'danger', etc.)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 *
 * @example
 * <ToggleSwitch
 *   id="notifications"
 *   label="Enable notifications"
 *   checked={isEnabled}
 *   onChange={(checked) => setIsEnabled(checked)}
 *   variant="success"
 * />
 */
export default function ToggleSwitch({
  id,
  label,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  variant = "success",
  className = "",
  style = {},
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const switchClasses = [
    "custom-toggle-switch",
    `toggle-${size}`,
    `toggle-${variant}`,
    disabled ? "toggle-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={switchClasses} style={style}>
      <Form.Check
        type="switch"
        id={id}
        label={label}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="toggle-input"
        {...props}
      />
    </div>
  );
}
