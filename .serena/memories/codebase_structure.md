# DSL Maker Codebase Structure

## Directory Organization

### Root Level
- `src/` - Main application source code
- `tests/` - Test files (unit and E2E)
- `docs/` - Project documentation
- `public/` - Static assets
- `node_modules/` - Dependencies
- Configuration files at root level

### Source Code Structure (`src/`)

#### Core Application (`src/app/`)
- `layout.tsx` - Root layout component
- `page.tsx` - Main application page
- `globals.css` - Global styles

#### Components (`src/components/`)
- `layout/` - Layout components (header, sidebars)
- `ui/` - Reusable UI components (shadcn/ui based)
- `workflow/` - Workflow-specific components
  - `nodes/` - Individual node implementations
  - `edges/` - Edge/connection components
- `settings/` - Configuration and settings components

#### State Management (`src/stores/`)
- `workflow-store.ts` - Main workflow state
- `workflow-store/` - Detailed store implementation
  - `slices/` - Separate concerns (ui, graph, validation, etc.)
  - `types.ts` - Store type definitions
- `chat-store.ts` - Chat interface state
- `settings-store.ts` - Application settings

#### Utilities (`src/utils/`)
- `workflow-state-helpers.ts` - Core workflow operations
- `dsl-generator.ts` - Convert workflows to DSL
- `dsl-parser.ts` - Parse DSL files to workflows
- `dsl-linter.ts` - DSL validation and error checking
- `dsl-structure-validation.ts` - Structure validation
- `flow-converter.ts` - Convert between formats
- `llm-service.ts` - LLM integration
- `llm-prompts.ts` - Prompt templates

#### Type Definitions (`src/types/`)
- `dify-workflow.ts` - Comprehensive Dify DSL types
- `dify-nodes.ts` - Node-specific type definitions

#### Constants (`src/constants/`)
- `node-types.ts` - Supported node types and definitions

#### Shared Libraries (`src/lib/`)
- `utils.ts` - General utility functions

### Test Structure (`tests/`)
- `*.test.ts` - Unit tests (Vitest)
- `*.spec.ts` - E2E tests (Playwright)
- `mocks/` - Test fixtures and mock data

### Key Architectural Patterns

#### Component Architecture
- **Layout Components**: App shell and navigation
- **Feature Components**: Domain-specific (workflow, settings)
- **UI Components**: Reusable, generic components
- **Node Components**: Workflow node implementations

#### State Management Pattern
- **Zustand Stores**: Global state with slice pattern
- **Local State**: Component-specific React state
- **Immutable Updates**: Using Immer for complex state changes

#### Data Flow
1. User interactions in components
2. Actions dispatched to Zustand stores
3. State updates trigger re-renders
4. Utilities handle DSL conversion and validation

#### Node System
- **Base Node**: Common interface and behavior
- **Specialized Nodes**: LLM, Code, HTTP, Control flow
- **Dynamic Registration**: Extensible node type system

### Import Patterns
- Use `@/` alias for all src imports
- Group imports: external, internal, types
- Prefer named exports over default exports
- Component imports use PascalCase