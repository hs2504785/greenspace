# Interactive Layer Highlighting Feature

## Overview

Enhanced the 7-layer forest visualization with interactive highlighting that responds to user clicks on layer buttons or visual elements.

## Features Implemented

### 1. Visual Highlighting Effects

- **Highlighted Elements**:

  - Scale up by 5% (`transform: scale(1.05)`)
  - White glowing border with multiple shadow layers
  - Pulsing animation effect
  - Higher z-index for prominence

- **Dimmed Elements**:
  - Reduced opacity to 30% (`opacity: 0.3`)
  - Smooth transition effects

### 2. Interactive Behavior

- **Click to Select**: Click any layer element to highlight it
- **Click to Deselect**: Click the same layer again to clear selection
- **Multiple Selection Points**:
  - Visual elements in cross-section
  - Layer buttons at bottom
  - Both sync with each other

### 3. Layer-Specific Highlighting

#### Trees (Layers 1, 2, 3):

- **Big Trees (Layer 1)**: Both trees at 0ft and 24ft highlight together
- **Medium Tree (Layer 2)**: Single tree at 12ft center
- **Small Trees (Layer 3)**: Both trees at 6ft and 18ft highlight together

#### Ground Layers (Layers 4, 5, 7):

- **Herbaceous Layer (Layer 4)**: Green band above ground
- **Ground Cover (Layer 5)**: Light green surface layer
- **Root Layer (Layer 7)**: Underground orange layer

#### Vine Layer (Layer 6):

- **All 3 Vines**: Highlight together as they're part of same layer
- **Positioned on Trees**: Show climbing relationship

### 4. User Interface Enhancements

#### Selection Indicators:

- **Active Badge**: Shows "Layer X Selected" when layer is chosen
- **Button States**: Selected buttons use dark variant
- **Clear Selection**: Red button appears when layer is selected

#### Hover Effects:

- **Subtle Preview**: Gentle scale and border on hover (when not highlighted)
- **Non-Interfering**: Hover effects disabled on already highlighted elements

### 5. CSS Classes Added

```css
.dimmed {
  opacity: 0.3 !important;
  transition: opacity 0.3s ease;
}

.highlighted {
  transform: scale(1.05);
  box-shadow: multiple white glows;
  border: 3px solid #fff !important;
  z-index: 100 !important;
  transition: all 0.3s ease;
  position: relative;
}

.highlighted::before {
  /* Pulsing border animation */
  animation: pulse 2s infinite;
}
```

### 6. JavaScript Logic

#### State Management:

- `selectedLayer` state tracks currently selected layer (1-7 or null)
- Toggle behavior: clicking selected layer deselects it

#### Conditional Classes:

```javascript
className={`${styles.baseClass}
  ${selectedLayer && selectedLayer !== layerNum ? styles.dimmed : ''}
  ${selectedLayer === layerNum ? styles.highlighted : ''}`}
```

#### Click Handlers:

```javascript
onClick={() => setSelectedLayer(selectedLayer === layerNum ? null : layerNum)}
```

## User Experience Benefits

### 1. Educational Value:

- **Focus Attention**: Highlights specific layer while dimming others
- **Clear Association**: Shows which visual elements belong to each layer
- **Interactive Learning**: Encourages exploration of different layers

### 2. Visual Clarity:

- **Reduced Clutter**: Dims non-relevant elements
- **Enhanced Contrast**: Makes selected elements stand out dramatically
- **Smooth Transitions**: Professional animation effects

### 3. Intuitive Controls:

- **Multiple Access Points**: Click visualization or buttons
- **Clear Feedback**: Visual and text indicators of selection
- **Easy Deselection**: Click again or use clear button

## Technical Implementation

### 1. Component Structure:

- **State-Driven**: React state controls all highlighting
- **Conditional Rendering**: Classes applied based on selection state
- **Event Handling**: Click handlers on all interactive elements

### 2. CSS Architecture:

- **Modular Classes**: Separate classes for different effects
- **Smooth Transitions**: Consistent 0.3s ease transitions
- **Z-Index Management**: Proper layering for highlighted elements

### 3. Performance Considerations:

- **CSS Transitions**: Hardware-accelerated animations
- **Minimal Re-renders**: Efficient state updates
- **Hover Optimization**: Prevents conflicts with highlighting

This interactive highlighting system transforms the static 7-layer visualization into an engaging, educational tool that helps users understand the spatial relationships and functions of each layer in the forest system.
