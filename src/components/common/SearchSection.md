# SearchSection Component

A reusable search section component that can be used anywhere in the application, not just in the header.

## Features

- **Reusable**: Can be used on any page or component
- **Mobile Optimized**: Responsive design with compact mobile view
- **Customizable**: Support for filters, cart, and additional actions
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Modern Styling**: Clean design without harsh outlines

## Basic Usage

```jsx
import SearchSection from "@/components/common/SearchSection";

function MyPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <SearchSection
      searchValue={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      onSearchSubmit={(query) => handleSearch(query)}
      onSearchClear={() => setSearchTerm("")}
      placeholder="Search products..."
    />
  );
}
```

## With Filters and Cart

```jsx
<SearchSection
  searchValue={searchTerm}
  onSearchChange={(e) => setSearchTerm(e.target.value)}
  onSearchSubmit={(query) => handleSearch(query)}
  onSearchClear={() => setSearchTerm("")}
  placeholder="Search products..."
  showFilters={true}
  onFilterClick={() => setShowFilters(true)}
  showCart={true}
  onCartClick={() => router.push("/cart")}
  cartItemCount={5}
/>
```

## Sticky and Compact Variants

```jsx
// Sticky search section (stays at top when scrolling)
<SearchSection
  searchValue={searchTerm}
  onSearchChange={(e) => setSearchTerm(e.target.value)}
  onSearchSubmit={(query) => handleSearch(query)}
  onSearchClear={() => setSearchTerm("")}
  placeholder="Search..."
  sticky={true}
/>

// Compact search section (smaller padding)
<SearchSection
  searchValue={searchTerm}
  onSearchChange={(e) => setSearchTerm(e.target.value)}
  onSearchSubmit={(query) => handleSearch(query)}
  onSearchClear={() => setSearchTerm("")}
  placeholder="Search..."
  compact={true}
/>
```

## With Custom Actions

```jsx
<SearchSection
  searchValue={searchTerm}
  onSearchChange={(e) => setSearchTerm(e.target.value)}
  onSearchSubmit={(query) => handleSearch(query)}
  onSearchClear={() => setSearchTerm("")}
  placeholder="Search..."
  additionalActions={
    <Button variant="outline-info" size="sm">
      <i className="ti-export"></i>
      Export
    </Button>
  }
/>
```

## Props

| Prop                | Type      | Default       | Description                                 |
| ------------------- | --------- | ------------- | ------------------------------------------- |
| `searchValue`       | string    | `""`          | Current search value                        |
| `onSearchChange`    | function  | -             | Handler for search input changes            |
| `onSearchSubmit`    | function  | -             | Handler for search submission               |
| `onSearchClear`     | function  | -             | Handler for clearing search                 |
| `placeholder`       | string    | `"Search..."` | Search input placeholder                    |
| `showFilters`       | boolean   | `false`       | Whether to show filter button               |
| `onFilterClick`     | function  | -             | Handler for filter button click             |
| `showCart`          | boolean   | `false`       | Whether to show cart button                 |
| `onCartClick`       | function  | -             | Handler for cart button click               |
| `cartItemCount`     | number    | `0`           | Number of items in cart                     |
| `className`         | string    | `""`          | Additional CSS classes                      |
| `sticky`            | boolean   | `false`       | Whether the search section should be sticky |
| `compact`           | boolean   | `false`       | Whether to use compact styling              |
| `additionalActions` | ReactNode | `null`        | Additional action buttons to show           |

## Styling

The component uses CSS classes that can be customized:

- `.search-section` - Main container
- `.search-section-sticky` - Sticky variant
- `.search-section-compact` - Compact variant
- `.search-action-btn` - Action buttons (filter, cart, etc.)

## Mobile Optimizations

- Responsive button sizing
- Touch-friendly tap targets
- Optimized spacing for mobile screens
- Icon-only buttons on very small screens
- Smooth animations and transitions

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Semantic HTML structure
