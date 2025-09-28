# Task Completion Checklist

## When a Development Task is Completed

### Immediate Validation Steps
1. **Code Quality Check**
   ```bash
   npm run lint    # Must pass ESLint rules
   ```

2. **Type Safety Verification**
   ```bash
   npm run build   # TypeScript compilation must succeed
   ```

3. **Unit Test Execution**
   ```bash
   npm test        # All unit tests must pass
   ```

4. **E2E Test Validation**
   ```bash
   npx playwright test  # Browser automation tests
   ```

### Code Review Requirements
- **Functionality**: Feature works as intended
- **Type Safety**: No TypeScript errors or warnings
- **Style Compliance**: Follows established conventions
- **Test Coverage**: Adequate unit and integration tests
- **Performance**: No significant performance regressions

### Before Committing
1. Run full test suite: `npm run lint && npm test && npm run build`
2. Test DSL generation/parsing functionality manually
3. Verify workflow editor operations work correctly
4. Check console for any runtime errors or warnings
5. Test with different node types and configurations

### Git Workflow
1. **Branch Strategy**: Create feature branches for all changes
2. **Commit Messages**: Use imperative mood, under 72 characters
3. **Staging**: Use `git add -p` for selective staging
4. **Review**: Self-review changes before pushing

### Documentation Updates
- Update relevant documentation if APIs changed
- Add inline comments for complex logic
- Update type definitions if data structures changed
- Note any breaking changes or migration requirements

### Manual Testing Checklist
- [ ] Workflow editor loads correctly
- [ ] Node creation and deletion works
- [ ] Edge connections function properly
- [ ] DSL generation produces valid YAML
- [ ] DSL parsing handles valid and invalid input
- [ ] Validation panel shows appropriate errors
- [ ] Settings and configuration persist correctly
- [ ] Chat interface integrates properly (if applicable)

### Performance Considerations
- Check bundle size impact: Monitor build output
- Verify no memory leaks in React components
- Test with complex workflows (many nodes/edges)
- Ensure responsive UI performance

### Security Verification
- No exposed API keys or secrets
- Input validation working correctly
- No XSS vulnerabilities in dynamic content
- Proper error handling without information leakage