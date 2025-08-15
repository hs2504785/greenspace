# SearchInput Component

A reusable search input component with a search icon prefix, consistent styling, and optional search submission handling.

## Features

- ✅ Search icon prefix (left side)
- ✅ Optional clear icon (right side, shown when text exists)
- ✅ Consistent Bootstrap styling
- ✅ Support for form submission and Enter key
- ✅ Configurable placeholder text
- ✅ Size variants (sm, lg)
- ✅ Disabled state support
- ✅ Custom CSS classes

## Usage Examples

### Basic Search (Live filtering)

```jsx
import SearchInput from "@/components/common/SearchInput";

const [searchTerm, setSearchTerm] = useState("");

<SearchInput
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search products..."
/>;
```

### Search with Submit Handler

```jsx
const [searchQuery, setSearchQuery] = useState("");

const handleSearch = (query) => {
  // Perform search action
  console.log("Searching for:", query);
};

<SearchInput
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onSubmit={handleSearch}
  placeholder="Search orders by ID, customer, or item..."
/>;
```

### Search with Clear Icon

```jsx
const [searchTerm, setSearchTerm] = useState("");

<SearchInput
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onClear={() => setSearchTerm("")}
  placeholder="Search with clear button..."
/>;
```

### Small Size Variant

```jsx
<SearchInput
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Quick search..."
  size="sm"
/>
```

### With Custom Styling

```jsx
<SearchInput
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search..."
  className="mb-3 w-100"
/>
```

### Disabled State

```jsx
<SearchInput
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search disabled..."
  disabled={true}
/>
```

## Props

| Prop          | Type     | Default     | Description                                                              |
| ------------- | -------- | ----------- | ------------------------------------------------------------------------ |
| `value`       | string   | -           | Current search input value                                               |
| `onChange`    | function | -           | Handler for input changes                                                |
| `onSubmit`    | function | -           | Optional handler for search submission                                   |
| `onClear`     | function | -           | Optional handler for clearing search (shows clear icon when text exists) |
| `placeholder` | string   | "Search..." | Placeholder text                                                         |
| `className`   | string   | ""          | Additional CSS classes                                                   |
| `disabled`    | boolean  | false       | Whether input is disabled                                                |
| `size`        | string   | -           | Bootstrap size ('sm', 'lg')                                              |

## Used In

- Seller Dashboard (order search with clear)
- Product Management (product search with clear)
- Vegetable Filters (vegetable search with clear)
- Admin User Management (user search with clear)

## Styling

The component uses Bootstrap classes and follows the app's design system:

- Search icon: `ti ti-search text-muted` (left side)
- Clear icon: `ti ti-close text-muted` (right side, when text exists)
- Input group styling with seamless borders
- Hover and focus states for clear button
- Consistent with other form components
