# Theme-Consistent Highlighting System

## Updated Color Scheme

### Green Theme Integration

Changed from white glow to green glow that matches the application's primary green theme (#28a745).

## Changes Made

### 1. Highlighted Elements

**Before (White Theme):**

```css
box-shadow: 0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(255, 255, 255, 0.7),
  0 0 60px rgba(255, 255, 255, 0.5);
border: 3px solid #fff !important;
```

**After (Green Theme):**

```css
box-shadow: 0 0 20px rgba(40, 167, 69, 0.9), 0 0 40px rgba(40, 167, 69, 0.7),
  0 0 60px rgba(40, 167, 69, 0.5);
border: 3px solid #28a745 !important;
```

### 2. Pulsing Animation

**Before:**

```css
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}
```

**After:**

```css
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}
```

### 3. Hover Effects

Updated all hover effects to use green theme:

**Trees:**

```css
border: 1px solid rgba(40, 167, 69, 0.5);
```

**Vines:**

```css
border-color: #28a745;
box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
```

### 4. Dimmed Elements (Unchanged)

Kept the same approach for dimmed elements:

```css
.dimmed {
  opacity: 0.3 !important;
  transition: opacity 0.3s ease;
}
```

This maintains the original colors of each layer while just reducing opacity, which provides better visual consistency.

## Visual Benefits

### 1. Theme Consistency

- **Green Glow**: Matches the primary green theme (#28a745)
- **Brand Alignment**: Consistent with Bootstrap success color
- **Professional Look**: Cohesive color scheme throughout

### 2. Better Contrast

- **Green on Green Background**: Better visibility on the green background areas
- **Natural Feel**: Green glow feels more organic for a farming/nature application
- **Accessibility**: Better contrast ratios

### 3. User Experience

- **Familiar Colors**: Users recognize the green as the app's primary color
- **Visual Hierarchy**: Clear distinction between selected/unselected states
- **Smooth Transitions**: Maintained smooth animations with new colors

## Color Values Used

### Primary Green Theme:

- **Solid Border**: `#28a745` (Bootstrap success)
- **Glow Effects**: `rgba(40, 167, 69, 0.9/0.7/0.5)` (varying opacity)
- **Hover Border**: `rgba(40, 167, 69, 0.5)` (50% opacity)
- **Pulse Animation**: `rgba(40, 167, 69, 0.7)` (70% opacity)

### Maintained Elements:

- **Dimmed Opacity**: `0.3` (30% of original color)
- **Original Layer Colors**: Preserved with opacity reduction
- **Background Colors**: Unchanged for each layer

This update creates a more cohesive visual experience that aligns with your application's green farming theme while maintaining excellent usability and accessibility.
