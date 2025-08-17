# 🎯 Common Components

Collection of reusable components for consistent UI patterns across the application.

## 🧹 ClearFiltersButton

A reusable clear filters button with consistent styling and height alignment.

### Usage

```jsx
import ClearFiltersButton from "@/components/common/ClearFiltersButton";

<ClearFiltersButton
  onClick={() => {
    setSearchTerm("");
    setCategoryFilter("all");
  }}
/>;
```

### Props

| Prop        | Type     | Default         | Description                             |
| ----------- | -------- | --------------- | --------------------------------------- |
| `onClick`   | function | -               | Handler function when button is clicked |
| `text`      | string   | "Clear Filters" | Button text                             |
| `className` | string   | ""              | Additional CSS classes                  |
| `disabled`  | boolean  | false           | Whether button is disabled              |
| `style`     | object   | {}              | Additional inline styles                |

### Features

- ✅ **Consistent height** (38px) to align with form controls
- ✅ **Responsive design** with proper flex alignment
- ✅ **Refresh icon** with consistent spacing
- ✅ **Bootstrap styling** with light variant and muted text
- ✅ **Flexible text** - customizable button text

### Used In

- Products Management (search + category filters)
- Users Management (search + role filters)
- Seller Dashboard (search + status + period filters)

---

## 🎯 Simple Placeholder Components

Minimal, reusable placeholder components using `ui-line` and `ui-block` CSS classes.

## 📦 Components

```jsx
import {
  TextPlaceholder,
  BlockPlaceholder,
  CirclePlaceholder,
  CardPlaceholder,
} from "@/components/common/Placeholder";
```

### **TextPlaceholder** - for any text

```jsx
<TextPlaceholder />                    // Default
<TextPlaceholder width="75" />         // 75% width
<TextPlaceholder className="mb-2" />   // With spacing
```

### **BlockPlaceholder** - for images, buttons, etc.

```jsx
<BlockPlaceholder />                   // Default 90px height
<BlockPlaceholder height="200px" />    // Custom height
<BlockPlaceholder width="50" />        // 50% width
```

### **CirclePlaceholder** - for avatars

```jsx
<CirclePlaceholder />                  // Default 40px
<CirclePlaceholder size="60px" />      // Custom size
```

### **CardPlaceholder** - flexible card structure

```jsx
<CardPlaceholder />                    // Default: image + 3 lines
<CardPlaceholder
  showImage={false}                    // Text only
  lines={5}                            // 5 text lines
  imageHeight="150px"                  // Custom image height
/>
```

## 🚀 Usage Examples

### **Any Card Structure**

```jsx
// Flexible - works for any card type
<CardPlaceholder showImage={true} lines={4} />    // Product card
<CardPlaceholder showImage={false} lines={2} />   // Text card
<CardPlaceholder imageHeight="100px" lines={3} /> // Small card
```

### **Custom Layout**

```jsx
// Build any structure with basic components
<div className="d-flex align-items-center">
  <CirclePlaceholder size="50px" className="me-3" />
  <div>
    <TextPlaceholder width="60" className="mb-1" />
    <TextPlaceholder width="40" />
  </div>
</div>
```

### **Direct CSS Classes**

```jsx
// Use CSS classes directly when simpler
<div className="ui-line ui-w-75 mb-2"></div>
<div className="ui-block" style={{height: '100px'}}></div>
```

## 📱 Real Examples

### **VegetableResultsLoader** ✅

```jsx
<CardPlaceholder showImage={true} imageHeight="200px" lines={4} />
```

### **Any List Loading**

```jsx
{
  Array.from({ length: 5 }, (_, i) => (
    <div key={i} className="mb-3">
      <TextPlaceholder width="80" />
    </div>
  ));
}
```

### **User Profile**

```jsx
<div className="d-flex">
  <CirclePlaceholder size="60px" className="me-3" />
  <div>
    <TextPlaceholder width="50" className="mb-1" />
    <TextPlaceholder width="75" />
  </div>
</div>
```

## 🎨 CSS Classes

**Base classes:**

- `.ui-line` - Text placeholder (15px height)
- `.ui-block` - Block placeholder (90px height)

**Width utilities:**

- `.ui-w-25` through `.ui-w-100` (25%, 40%, 50%, 60%, 75%, 80%, 100%)

**Usage:**

```jsx
<div className="ui-line ui-w-75"></div>           // 75% width line
<div className="ui-block ui-w-50"></div>          // 50% width block
<div className="ui-line" style={{height: '20px'}}></div>  // Custom height
```

## ✨ Benefits

✅ **Minimal** - Only essential CSS and components  
✅ **Flexible** - Works for any structure  
✅ **Smooth** - Beautiful left-to-right shimmer animation  
✅ **Consistent** - Same styling across all placeholders  
✅ **Reusable** - One component, many layouts  
✅ **No bloat** - No specific UI assumptions

**Perfect for any card, list, or layout structure!** 🚀
