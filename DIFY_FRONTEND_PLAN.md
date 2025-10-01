# Dify DSL Frontend Implementation Plan

**Date:** 2025-10-01
**Status:** 📋 Planning Complete - Ready to Start
**Related Backend:** Tag `v2-dify-backend-complete`

---

## 🎯 Goal

Implement complete Dify DSL compatibility in the frontend, enabling import/export of real Dify workflows while maintaining visual similarity to Dify's UI where practical.

**Guiding Principle:** **Compatibility > Visual Perfection**

---

## 📊 Current Status

### Backend (✅ Complete)
- ✅ Complete Pydantic models (15 node types)
- ✅ Builder API (high-level construction functions)
- ✅ Converter V2 (existing DSL → Dify conversion)
- ✅ 100% test coverage (10 real Dify samples)
- ✅ Tagged as `v2-dify-backend-complete`

### Frontend (Current State)
- React Flow-based workflow visualization
- Existing custom DSL format (YAML generation)
- 9 node types already implemented
- API client for backend integration

---

## 📋 Implementation Plan (Priority Order)

### Phase 1: TypeScript Type Definitions ⚡ HIGHEST PRIORITY

**Goal:** Port complete Pydantic models to TypeScript

**New Files:**
```
frontend/types/
  ├── dify-base.ts        # Base structures (Node, Edge, Position)
  ├── dify-nodes.ts       # All 15 node type definitions
  ├── dify-workflow.ts    # Workflow, Graph, complete DSL
  └── index.ts            # Exports
```

**Implementation Content:**
- `DifyNodeBase`, `DifyPosition`, `DifyEdge`
- All 15 node Data types (Start, End, LLM, IfElse, Code, Iteration, etc.)
- `DifyDSL` root type
- Variable reference helper types

**Why Highest Priority:**
- Foundation for all other implementation
- Ensures complete type compatibility with backend
- TypeScript type checking prevents bugs

**Estimated Time:** 1 week

**Success Criteria:**
- [ ] All backend Pydantic models have TypeScript equivalents
- [ ] Types compile without errors
- [ ] Example Dify DSL can be typed correctly

---

### Phase 2: Dify DSL Import/Export 🔄 HIGH PRIORITY

**Goal:** Enable reading and writing Dify YAML files

**New Files:**
```
frontend/lib/
  ├── dify-client.ts      # Dify DSL-specific API client
  └── dify-converter.ts   # Internal format ⇔ Dify format conversion
```

**Implementation Content:**

**2-1. Import Functionality:**
- YAML file upload UI
- Dify DSL → React Flow format conversion
- Validation + error display
- Load workflow into editor

**2-2. Export Functionality:**
- Current workflow → Dify DSL conversion
- YAML download
- Integration with Backend Converter V2

**2-3. Backend API Additions:**
```python
POST /api/v1/dify/validate  # Validate Dify DSL
POST /api/v1/dify/convert   # Convert existing DSL → Dify format
POST /api/v1/dify/import    # Parse and validate Dify YAML
```

**Why High Priority:**
- Most practical functionality
- Enables editing existing Dify workflows
- Demonstrates compatibility immediately

**Estimated Time:** 1-2 weeks

**Success Criteria:**
- [ ] Can import real Dify YAML files from `backend/knowledge_base/dify_samples/`
- [ ] Imported workflows display correctly in React Flow editor
- [ ] Can export current workflow as valid Dify YAML
- [ ] Exported YAML passes backend validation (DifyDSL Pydantic model)
- [ ] Round-trip: Import → Edit → Export → Import works correctly

---

### Phase 3: Dify-Style Node Components 🎨 MEDIUM PRIORITY

**Goal:** Make visual appearance closer to Dify UI

**Target Files:**
```
frontend/components/nodes/
  ├── dify/
  │   ├── DifyStartNode.tsx
  │   ├── DifyEndNode.tsx
  │   ├── DifyLLMNode.tsx
  │   ├── DifyIfElseNode.tsx
  │   ├── DifyCodeNode.tsx
  │   ├── DifyIterationNode.tsx
  │   ├── DifyToolNode.tsx
  │   ├── DifyAnswerNode.tsx
  │   └── ... (all 15 types)
  └── BaseNode.tsx (refactor)
```

**Implementation Approach:**

**Simplified Version (Recommended First):**
- Icon + Title only
- Node type color coding
- Clean, minimal design
- **Low implementation cost**

**Detailed Version (Optional):**
- Dify-like property display within nodes
- Hover previews
- Inline editing
- **High implementation cost - can defer**

**Dify UI Characteristics:**
- Color bar on left side (different color per node type)
- Icon + node title
- Explicit input/output handles
- Hover state with details preview

**Staged Implementation:**

**Step 1:** Refactor existing BaseNode to Dify style (colors, icons)
- Estimated: 2-3 days

**Step 2:** Create dedicated components per node type
- Estimated: 1 week

**Step 3:** Property panel for detailed editing (extend existing feature)
- Estimated: 3-5 days

**Why Medium Priority:**
- Visual improvements don't affect compatibility
- Functionality first, polish later

**Estimated Time:** 2-3 weeks total (can be split)

**Success Criteria:**
- [ ] Nodes visually distinguishable by type
- [ ] Color-coded according to Dify conventions
- [ ] Icons match or approximate Dify node types
- [ ] All 15 node types have dedicated components
- [ ] Properties panel supports Dify-specific fields

---

### Phase 4: Advanced Features 🚀 LOW PRIORITY (Optional)

**Goal:** Support complex Dify features

**4-1. Iteration (Nested Structure) Visualization**
- Display child nodes inside parent iteration node
- Leverage React Flow's `parentId`/`extent` features
- Visual grouping and indentation

**Estimated:** 1 week

**4-2. Conversation Variables Management UI**
- Variable management panel for stateful workflows
- Add/edit/delete conversation variables
- Variable type selection
- Reference helper

**Estimated:** 3-5 days

**4-3. Marketplace Dependencies Display**
- Show external dependencies
- Version information display
- (Optional) Dependency installation UI

**Estimated:** 2-3 days

**Why Low Priority:**
- Can be added after basic functionality works
- High complexity, requires careful implementation
- Not essential for basic import/export workflow

**Estimated Time:** 2-3 weeks total (optional)

**Success Criteria:**
- [ ] Iteration nodes show child nodes correctly
- [ ] Conversation variables can be managed via UI
- [ ] Dependencies are displayed in workflow info

---

## 🎯 Recommended Implementation Order

```
Week 1: Phase 1 (TypeScript Type Definitions)
        ↓
Week 2-3: Phase 2 (Import/Export Functionality)
        ↓
        ← **Practical compatibility achieved at this point**
        ↓
Week 4-5: Phase 3 Step 1-2 (Basic Dify styling)
        ↓
Week 6: Phase 3 Step 3 (Detailed UI, optional)
        ↓
Week 7+: Phase 4 (Advanced features, optional)
```

**Minimum Viable Product (MVP):** Phase 1 + Phase 2
**Full Basic Implementation:** Phase 1 + Phase 2 + Phase 3 Steps 1-2
**Complete Implementation:** All phases

---

## ⚖️ Trade-off Strategy

### Compatibility > Visual Appearance
- First priority: Complete Dify DSL import/export
- Node appearance: Gradual improvement

### Simple > Perfect
- Don't implement all features at once
- Start with minimal working implementation
- Test and expand iteratively

### Leverage Existing Features
- Maximize use of React Flow's built-in features
- Don't reinvent the wheel
- Extend existing components where possible

---

## 📐 Technical Architecture

### Data Flow (Import)
```
YAML File
  ↓ (js-yaml parse)
DifyDSL Object (TypeScript)
  ↓ (dify-converter.ts)
React Flow Nodes/Edges
  ↓
Editor Display
```

### Data Flow (Export)
```
React Flow Nodes/Edges
  ↓ (dify-converter.ts)
DifyDSL Object (TypeScript)
  ↓ (Backend validation)
Validated DifyDSL
  ↓ (js-yaml stringify)
YAML File Download
```

### Component Structure
```
WorkflowEditor
  ├── ReactFlowProvider
  │   ├── DifyStartNode
  │   ├── DifyEndNode
  │   ├── DifyLLMNode
  │   └── ... (all node types)
  ├── DifyImportButton
  ├── DifyExportButton
  └── NodePropertiesPanel (extended)
```

---

## 🧪 Testing Strategy

### Phase 1 Testing
- [ ] Type definitions compile without errors
- [ ] Example Dify DSL can be correctly typed
- [ ] No `any` types except where truly necessary

### Phase 2 Testing
- [ ] Import all 10 real Dify samples from `backend/knowledge_base/dify_samples/`
- [ ] Verify all nodes and edges load correctly
- [ ] Export and re-import (round-trip test)
- [ ] Validate exported YAML with backend Pydantic models
- [ ] Test error handling for invalid YAML

### Phase 3 Testing
- [ ] Visual regression testing (screenshots)
- [ ] All node types render correctly
- [ ] Properties panel works for all node types
- [ ] UI is responsive and performant

### Phase 4 Testing
- [ ] Iteration nodes with nested children
- [ ] Conversation variables persist correctly
- [ ] Dependencies display properly

---

## 📚 Reference Materials

### Backend Implementation
- **Models:** `backend/app/models/dify_models.py`
- **Builder API:** `backend/app/utils/dify_builder.py`
- **Converter:** `backend/app/utils/dify_converter_v2.py`
- **Tests:** `backend/test_dify_models_comprehensive.py`
- **Documentation:** `backend/README_DIFY.md`
- **Summary:** `backend/DIFY_IMPLEMENTATION_SUMMARY.md`
- **Git Tag:** `v2-dify-backend-complete`

### Sample Files
- **Location:** `backend/knowledge_base/dify_samples/`
- **Count:** 10 real Dify exports
- **Coverage:** 4 app modes, 15 node types

### Dify Official
- **Version:** 0.4.0
- **DSL Spec:** Based on real exports (not theoretical docs)

---

## 🚀 Getting Started

### Prerequisites
```bash
# Backend must be running
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Frontend development
cd frontend
npm install
npm run dev
```

### Phase 1 Start
1. Create `frontend/types/` directory
2. Start with `dify-base.ts` (base types)
3. Reference `backend/app/models/dify_models.py` for structure
4. Use exact field names and types

### Key TypeScript Libraries
```bash
npm install js-yaml @types/js-yaml  # YAML parsing
```

---

## 📝 Progress Tracking

### Phase 1: TypeScript Types
- [ ] `dify-base.ts` created
- [ ] `dify-nodes.ts` created (all 15 types)
- [ ] `dify-workflow.ts` created
- [ ] Types compile successfully
- [ ] Example DSL typed correctly

### Phase 2: Import/Export
- [ ] Backend API endpoints added
- [ ] `dify-client.ts` implemented
- [ ] `dify-converter.ts` implemented
- [ ] Import UI component created
- [ ] Export UI component created
- [ ] All sample files import successfully
- [ ] Round-trip testing passes

### Phase 3: Dify-Style Components
- [ ] BaseNode refactored with Dify styling
- [ ] All 15 node components created
- [ ] Properties panel extended
- [ ] Visual testing complete

### Phase 4: Advanced Features
- [ ] Iteration visualization implemented
- [ ] Conversation variables UI created
- [ ] Dependencies display added

---

## 🎯 Success Metrics

**MVP Success (Phase 1 + 2):**
- ✅ Can import any real Dify YAML file
- ✅ Can export workflow as valid Dify YAML
- ✅ Round-trip import/export works perfectly
- ✅ Backend validation passes 100%

**Full Success (All Phases):**
- ✅ All above MVP criteria
- ✅ Visual appearance similar to Dify
- ✅ All 15 node types fully supported
- ✅ Advanced features (iteration, variables) work
- ✅ User-friendly and intuitive

---

## 📌 Notes

### Why Not Screen-Scrape Dify UI?
- Dify is open source, but we prioritize **DSL compatibility** over UI cloning
- React Flow has different architecture than Dify's canvas implementation
- Focus on functionality first, visual polish second

### Dealing with Complexity
- Dify DSL has evolved over time - we support 0.4.0 specifically
- Some fields are optional in simplified format vs. full format
- Backend handles this complexity - frontend should mirror it

### Future Considerations
- Dify may update to 0.5.0+ - we'll need to track changes
- Consider contributing improvements back to Dify project
- May want to support multiple Dify versions in future

---

**Last Updated:** 2025-10-01
**Next Review:** After Phase 1 completion
