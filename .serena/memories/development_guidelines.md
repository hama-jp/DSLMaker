# Development Guidelines & Best Practices

## From CLAUDE.md Guidelines

### Implementation Preparation
- **Always backup important files** before major changes
  ```bash
  mkdir -p ~/backup_$(date +%Y%m%d_%H%M%S)
  cp -r important_files/ ~/backup_$(date +%Y%m%d_%H%M%S)/
  ```
- **Use feature branches** for all development work
- **Minimal changes** to base classes and core modules

### Code Change Principles
- **Consider impact scope** - how changes affect other components
- **Always check for None/Null** especially in Python-like operations
- **Implement fallback mechanisms** for error handling
  ```typescript
  try {
    result = await newFeatureProcess()
  } catch (error) {
    console.warn(`New feature failed, falling back: ${error}`)
    result = legacyProcess() // Fallback
  }
  ```

### Testing Strategy
- **Progressive testing**: Simple → Complex → Integration → Performance
- **Use mocks** for interactive input requirements
- **Always investigate** WARNING/ERROR logs
- **Test edge cases** thoroughly

### Debugging Approach
- **Read error messages carefully** - TypeScript errors are descriptive
- **Incremental fixes** - solve one problem at a time
- **Graceful degradation** - implement fallback mechanisms

### Pull Request Management
- **Frequent commits** - commit and push bug fixes immediately
- **English descriptions** with honest Known Limitations
- **Show test results** with specific successful test cases
- **Before/After metrics** for performance improvements

## Project-Specific Guidelines

### DSL Maker Specifics
- **Node Types**: Extend `NODE_TYPES` in `src/constants/node-types.ts`
- **State Updates**: Use Zustand stores with Immer for complex updates
- **Validation**: Always validate DSL structure and node connections
- **Type Safety**: Leverage comprehensive TypeScript definitions

### React Flow Integration
- **Custom Nodes**: Implement in `src/components/workflow/nodes/`
- **Edge Handling**: Custom edge components for workflow connections
- **State Sync**: Keep React Flow state synchronized with Zustand store

### DSL Operations
- **Generation**: Use `dsl-generator.ts` for YAML output
- **Parsing**: Use `dsl-parser.ts` for YAML input processing
- **Validation**: Use `dsl-linter.ts` for comprehensive validation
- **Structure Check**: Use `dsl-structure-validation.ts` for format validation

### Error Handling Best Practices
- **User-friendly messages** in the UI
- **Detailed logging** for debugging
- **Graceful fallbacks** for failed operations
- **Clear validation feedback** in the validation panel

### Performance Considerations
- **Bundle size** - monitor with build output
- **React performance** - use React.memo for expensive components
- **State updates** - batch related state changes
- **Large workflows** - optimize for many nodes/edges

### Security Guidelines
- **No secrets in code** - use environment variables
- **Input sanitization** - validate all user inputs
- **Safe YAML parsing** - validate DSL structure
- **Error handling** - no information leakage in error messages