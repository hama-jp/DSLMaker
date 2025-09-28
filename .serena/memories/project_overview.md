# DSL Maker Project Overview

## Project Purpose
DSL Maker is a Next.js-based web application that provides a visual interface for creating and editing Dify Workflow DSL (Domain Specific Language) files. The application allows users to:

- Visually design AI workflows using a node-based graph editor
- Generate valid Dify DSL YAML files from visual workflows
- Parse and validate existing DSL files
- Preview and test workflow configurations

## Tech Stack
- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS 4.0 with utility-first approach
- **UI Components**: Radix UI components with shadcn/ui patterns
- **State Management**: Zustand for global state management
- **Graph Visualization**: @xyflow/react for workflow node editor
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Linting**: ESLint with Next.js and TypeScript configurations

## Key Features
- Visual workflow editor with drag-and-drop nodes
- Real-time DSL generation and validation
- Support for multiple Dify node types (LLM, Code, HTTP, If-Else, etc.)
- Chat interface for testing workflows
- Import/export functionality for DSL files
- Comprehensive validation and error reporting

## Architecture
- **Frontend**: Next.js App Router with React Server Components
- **State**: Zustand stores with sliced architecture
- **Components**: Modular component structure with separation of concerns
- **Utils**: Centralized utility functions for DSL operations
- **Types**: Comprehensive TypeScript definitions for Dify DSL format