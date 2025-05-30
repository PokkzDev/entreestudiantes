# Standardized Button System

This app uses a standardized button system located in `styles/buttons.module.css` to ensure consistent styling across all components.

## Usage

Import the button styles in your component:

```javascript
import buttonStyles from "@/styles/buttons.module.css";
```

## Available Button Types

### Primary Button (Main Actions)
```jsx
<button className={buttonStyles.primary}>
  Save Changes
</button>
```
- **Use for**: Primary actions like save, submit, confirm
- **Color**: Blue (`#2563eb`)

### Secondary Button (Secondary Actions)
```jsx
<button className={buttonStyles.secondary}>
  Cancel
</button>
```
- **Use for**: Secondary actions like cancel, reset, go back
- **Color**: Light gray with border

### Danger Button (Destructive Actions)
```jsx
<button className={buttonStyles.danger}>
  Delete Account
</button>
```
- **Use for**: Destructive actions like delete, remove
- **Color**: Red (`#dc2626`)

### Success Button (Success Actions)
```jsx
<button className={buttonStyles.success}>
  Complete
</button>
```
- **Use for**: Success actions like complete, approve
- **Color**: Green (`#16a34a`)

## Button Variants

### Outline Buttons
```jsx
<button className={buttonStyles.primaryOutline}>Primary Outline</button>
<button className={buttonStyles.dangerOutline}>Danger Outline</button>
```

### Icon Button
```jsx
<button className={buttonStyles.iconButton}>
  <Icon />
</button>
```

## Size Modifiers

### Small Button
```jsx
<button className={`${buttonStyles.primary} ${buttonStyles.small}`}>
  Small
</button>
```

### Large Button
```jsx
<button className={`${buttonStyles.primary} ${buttonStyles.large}`}>
  Large
</button>
```

## Width Modifiers

### Full Width
```jsx
<button className={`${buttonStyles.primary} ${buttonStyles.fullWidth}`}>
  Full Width
</button>
```

### Fit Content
```jsx
<button className={`${buttonStyles.primary} ${buttonStyles.fitContent}`}>
  Fit Content
</button>
```

## Loading State

For buttons with loading state:

```jsx
<button 
  className={`${buttonStyles.primary} ${loading ? buttonStyles.loading : ''}`}
  disabled={loading}
>
  {loading ? "Loading..." : "Submit"}
</button>
```

## Combining Classes

You can combine multiple classes for complex styling:

```jsx
<button 
  className={`${buttonStyles.primary} ${buttonStyles.large} ${buttonStyles.fullWidth}`}
>
  Large Full Width Primary Button
</button>
```

## Best Practices

1. **Use semantic button types**: Choose the button type that matches the action semantics
2. **Consistent sizing**: Use the same size for buttons in the same context
3. **Loading states**: Always include loading states for async actions
4. **Proper disabled states**: Disable buttons during loading or when action is not available
5. **Accessibility**: Ensure buttons have proper ARIA labels and keyboard navigation

## Migration from Component-Specific Styles

When migrating from component-specific button styles:

1. Import the global button styles
2. Replace local button classes with appropriate global ones
3. Remove old button styles from component CSS files
4. Test functionality and visual consistency

## Examples in App

- **Configuraciones sections**: All use standardized buttons for consistency
- **Forms**: Primary for submit, secondary for cancel/reset
- **Modals**: Appropriate button types for different actions
- **Image actions**: Small variants for compact interfaces 