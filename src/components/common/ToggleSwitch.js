"use client";

import { Form } from "react-bootstrap";
import "./ToggleSwitch.css";

/**
 * Reusable Toggle Switch component with consistent styling
 *
 * @param {string} id - Unique identifier for the switch
 * @param {string} label - Label text for the switch
 * @param {string} description - Optional description text below the label
 * @param {boolean} checked - Whether the switch is checked
 * @param {function} onChange - Handler for switch state changes
 * @param {boolean} disabled - Whether the switch is disabled
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {string} variant - Color variant ('primary', 'success', 'danger', etc.)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 * @param {boolean} showDescription - Whether to show the description
 *
 * @example
 * <ToggleSwitch
 *   id="notifications"
 *   label="Enable notifications"
 *   description="Get notified about important updates"
 *   checked={isEnabled}
 *   onChange={(checked) => setIsEnabled(checked)}
 *   variant="success"
 * />
 */
export default function ToggleSwitch({
  id,
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  variant = "success",
  className = "",
  style = {},
  showDescription = false,
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const switchClasses = [
    "modern-toggle-switch",
    `toggle-${size}`,
    `toggle-${variant}`,
    disabled ? "toggle-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={switchClasses} style={style}>
      <div className="toggle-content">
        <div className="toggle-text">
          <strong className="toggle-label">{label}</strong>
          {(description || showDescription) && (
            <div className="toggle-description">{description}</div>
          )}
        </div>
        <Form.Check
          type="switch"
          id={id}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="toggle-input"
          {...props}
        />
      </div>
    </div>
  );
}
