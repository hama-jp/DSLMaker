# DSL Maker Development Commands

## Core Development Commands

### Development Server
```bash
npm run dev        # Start development server at http://localhost:3000
npm run build      # Build production bundle
npm run start      # Start production server (requires build first)
```

### Code Quality & Testing
```bash
npm run lint       # Run ESLint with Next.js and TypeScript rules
npm test           # Run Vitest unit tests
npx playwright test # Run E2E browser tests (auto-starts dev server)
```

### Manual Testing Scripts
```bash
node test-complete-flow.js     # Scripted smoke test (adjust URLs/credentials)
node test-real-llm.js          # Test with real LLM integration
node test-integration.js       # Integration test script
```

## System Commands (Linux)
```bash
# Git operations
git status
git add .
git commit -m "message"
git push

# File operations
ls -la
find . -name "*.ts" -type f
grep -r "pattern" src/
cat filename.txt

# Process management
ps aux | grep node
kill -9 <pid>
```

## Testing Strategy
- **Unit Tests**: Focus on utils, stores, and helpers with Vitest
- **E2E Tests**: Browser automation with Playwright
- **Manual Tests**: Scripted flows for integration testing
- **Validation**: Always test DSL generation and parsing

## Development Workflow
1. Start dev server: `npm run dev`
2. Make code changes
3. Run linter: `npm run lint`
4. Run unit tests: `npm test`
5. Run E2E tests: `npx playwright test`
6. Build for production: `npm run build`

## Configuration Files
- `package.json` - Scripts and dependencies
- `tsconfig.json` - TypeScript configuration with @/ alias
- `eslint.config.mjs` - ESLint rules (allows @typescript-eslint/no-explicit-any)
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration