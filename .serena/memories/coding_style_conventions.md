# DSL Maker Coding Style & Conventions

## Code Style Guidelines

### TypeScript & React
- **Language**: TypeScript with strict type checking enabled
- **Components**: Functional React components (no class components)
- **Exports**: PascalCase for component exports, camelCase for utilities
- **Type Hints**: Comprehensive TypeScript interfaces, avoid `any` where possible
- **Hooks**: Custom hooks for reusable stateful logic

### File Organization
- **Naming**: `kebab-case` for filenames (e.g., `workflow-editor.tsx`)
- **Structure**: Organized by feature/domain rather than file type
- **Imports**: Use `@/` alias for src imports, absolute imports preferred
- **Extensions**: `.tsx` for React components, `.ts` for utilities

### Code Formatting
- **Indentation**: 2-space indentation (not tabs)
- **Styling**: Tailwind CSS utility classes with `clsx` for conditional styles
- **Quotes**: Single quotes for strings, double quotes for JSX attributes
- **Semicolons**: Required (enforced by ESLint)

### Component Structure
```tsx
// Good component structure example
import { useState } from 'react'
import { clsx } from 'clsx'
import type { ComponentProps } from '@/types'

interface Props extends ComponentProps {
  isActive: boolean
  onToggle: () => void
}

export function MyComponent({ isActive, onToggle, className }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  
  return (
    <div className={clsx('base-styles', isActive && 'active-styles', className)}>
      {/* Component content */}
    </div>
  )
}
```

### State Management
- **Global State**: Zustand stores with slice pattern
- **Local State**: React useState/useReducer for component-specific state
- **Store Structure**: Separate slices for different concerns (ui, graph, validation)
- **Immutability**: Use Immer for complex state updates

### Type Definitions
- **Interfaces**: Comprehensive TypeScript interfaces for all data structures
- **Node Types**: Extend `NODE_TYPES` in `src/constants/node-types.ts` for new nodes
- **Dify Types**: Detailed type definitions in `src/types/dify-workflow.ts`
- **Validation**: Strong typing for validation results and error handling

### ESLint Configuration
- **Rules**: Next.js and TypeScript recommended rules
- **Overrides**: 
  - `@typescript-eslint/no-explicit-any: "off"` (allowed but discouraged)
  - `@typescript-eslint/no-require-imports: "off"` for .js files
- **Ignores**: node_modules, .next, build artifacts

### Testing Conventions
- **Unit Tests**: Place in `tests/` with `.test.ts` suffix
- **E2E Tests**: Playwright specs with `.spec.ts` suffix
- **Mocks**: Reusable fixtures in `tests/mocks/`
- **Coverage**: Text and HTML coverage reports via Vitest

### Security Guidelines
- **Secrets**: Store in `.env.local`, never commit API keys
- **Validation**: Sanitize all user inputs and external data
- **Dependencies**: Regular security audits, avoid deprecated packages