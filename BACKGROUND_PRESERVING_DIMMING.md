# Background-Preserving Dimming System

## Problem Solved

The previous dimming system was changing the background colors of ground layers (root, herbaceous, ground cover) when they were dimmed, making them appear dark instead of maintaining their original colors with reduced visibility.

## Solution Implemented

### Different Dimming Strategies by Element Type

#### 1. Trees (Opacity-Based Dimming)

```css
.bigTree.dimmed,
.mediumTree.dimmed,
.smallTree.dimmed {
  opacity: 0.3 !important;
}
```

- **Why**: Trees are solid colored elements where opacity works well
- **Effect**: Maintains tree color while reducing visibility to 30%

#### 2. Ground Layers (Filter-Based Dimming)

```css
.herbaceousLayer.dimmed,
.groundCoverLayer.dimmed,
.rootLayer.dimmed {
  filter: brightness(0.4) saturate(0.7);
}
```

- **Why**: Ground layers have background colors that need to be preserved
- **Effect**:
  - `brightness(0.4)` - Reduces brightness to 40% (similar to 30% opacity)
  - `saturate(0.7)` - Slightly desaturates colors for dimmed effect
- **Advantage**: Preserves original background colors while creating dimmed appearance

#### 3. Vine Layer (Opacity-Based Dimming)

```css
.vineLayer.dimmed {
  opacity: 0.3 !important;
}
```

- **Why**: Vines are transparent overlay elements where opacity works well
- **Effect**: Maintains vine colors while reducing visibility

## Visual Comparison

### Before (Problematic):

- **Ground Layers**: Background colors changed to dark/black when dimmed
- **Trees**: Worked correctly with opacity
- **Inconsistent**: Different visual behavior across layer types

### After (Fixed):

- **Ground Layers**: Keep original colors (green, brown, orange) but appear dimmed
- **Trees**: Continue to work correctly with opacity
- **Consistent**: All layers maintain their identity while being visually de-emphasized

## Technical Benefits

### 1. Color Preservation

- **Original Colors**: Ground layers keep their meaningful colors
- **Visual Identity**: Each layer remains recognizable even when dimmed
- **Educational Value**: Users can still identify layer types by color

### 2. Better User Experience

- **Consistent Behavior**: All layers dim appropriately for their type
- **Natural Appearance**: Dimming looks more natural and less jarring
- **Clear Hierarchy**: Selected layers stand out without losing context

### 3. CSS Filter Advantages

- **Background Preservation**: Filters work on the visual appearance without changing underlying colors
- **Smooth Transitions**: Same 0.3s transition timing as other effects
- **Hardware Acceleration**: CSS filters are GPU-accelerated for smooth performance

## Implementation Details

### Filter Values Chosen:

- **brightness(0.4)**: Equivalent to ~30% opacity for visibility consistency
- **saturate(0.7)**: Slight desaturation makes dimmed state more obvious
- **Combined Effect**: Creates clear dimmed appearance while preserving color identity

### Transition Consistency:

```css
.dimmed {
  transition: all 0.3s ease;
}
```

- **Unified Timing**: All dimming effects use same 0.3s duration
- **Smooth Animation**: Consistent with highlighting transitions
- **Professional Feel**: Cohesive animation system

This solution ensures that when users click on a specific layer, the non-selected layers become visually de-emphasized while maintaining their original colors and identity, creating a better educational experience for understanding the 7-layer forest system.
