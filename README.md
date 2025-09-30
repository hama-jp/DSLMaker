# DSLMaker v2 🚀

**AI-Powered Dify Workflow Generator**

Generate sophisticated, production-ready Dify workflows through intelligent multi-agent AI system with RAG capabilities.

---

## 🎯 Project Status

**Version**: 2.0.0-alpha (Reconstruction Phase)
**Status**: 🚧 In Development - Phase 0 (Preparation)
**Started**: 2025-09-30

### Current Phase

**Phase 0: Preparation & Setup** (Week 1)
- [x] Architecture design completed
- [x] Project structure created
- [ ] Backend environment setup
- [ ] Frontend environment setup
- [ ] Vector database configuration
- [ ] CI/CD pipeline basics

---

## 📚 Documentation

### Core Documents

- **[📋 Project Reconstruction Plan](./PROJECT_RECONSTRUCTION_PLAN.md)** - Complete architecture redesign plan
- **[🏛️ Architecture Overview](./docs/v2/architecture/)** - System architecture (Coming Soon)
- **[🔌 API Documentation](./docs/v2/api/)** - API reference (Coming Soon)
- **[📖 User Guide](./docs/v2/guides/)** - How to use DSLMaker (Coming Soon)

### Reference Documents

- **[📝 Dify DSL Reference](./dify_workflow_DSLリファレンス.md)** - Official Dify DSL specification
- **[🔍 Node Definitions](./DSL_NodeDefinitionsTechnicalReference.md)** - Technical node reference
- **[💼 v1 Archive](./archive_v1_20250930_214450/)** - Previous implementation (archived)

---

## 🏗️ Architecture Overview

### System Design

DSLMaker v2 uses a **hybrid architecture** separating intelligence from presentation:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                  UI • Visualization • UX                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST/WebSocket API
┌─────────────────────────┴───────────────────────────────────┐
│              Backend (FastAPI + Python)                      │
│          Multi-Agent AI • RAG • Intelligence                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         LangGraph Multi-Agent System                │    │
│  │  [Requirements][Architecture][Config][Quality]      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vector Store │  │ LLM Providers│  │  Validation  │      │
│  │ (Pinecone/   │  │  (OpenAI)    │  │   Engine     │      │
│  │  ChromaDB)   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

**Frontend** (`/frontend`):
- Next.js 15 with TypeScript
- React Flow for workflow visualization
- Zustand for state management
- Pure presentation layer - no AI logic

**Backend** (`/backend`):
- FastAPI with Python 3.11+
- LangGraph for multi-agent orchestration
- LangChain for LLM integration
- 4 specialized agents: Requirements, Architecture, Configuration, Quality

**Knowledge Base** (`/backend/knowledge_base`):
- Curated workflow patterns (6+ core patterns)
- Vector embeddings for semantic search
- Best practices and anti-patterns
- Performance metrics

---

## 🚀 Quick Start

### Prerequisites

**Backend:**
- Python 3.11+
- Poetry (dependency management)

**Frontend:**
- Node.js 18+
- npm or pnpm

**Infrastructure:**
- Pinecone account (or ChromaDB for local dev)
- OpenAI API key

### Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/dslmaker-v2.git
cd dslmaker-v2

# 2. Backend setup
cd backend
poetry install
cp .env.example .env
# Edit .env with your API keys

# 3. Frontend setup
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL

# 4. Run development servers
# Terminal 1 - Backend
cd backend
poetry run uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Environment Variables

**Backend** (`.env`):
```env
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-west1-gcp
DATABASE_URL=sqlite:///./dslmaker.db
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 📖 How It Works

### Workflow Generation Process

1. **Requirements Analysis**
   - User describes desired workflow in natural language
   - Requirements agent clarifies ambiguities
   - Structured requirements extracted

2. **Architecture Design**
   - Retrieves similar patterns from knowledge base (RAG)
   - Architecture agent selects optimal pattern
   - Designs node structure and data flow

3. **Node Configuration**
   - Configuration agent optimizes each node
   - Advanced prompt engineering
   - Performance tuning (model selection, parameters)

4. **Quality Assurance**
   - Multi-dimensional validation
   - Quality scoring (0-100)
   - Recommendations for improvement

5. **DSL Generation**
   - Generates production-ready Dify YAML
   - Complete with metadata, features, and optimization

### Example Usage

```python
# API Example
import requests

response = requests.post("http://localhost:8000/api/v1/generate/full", json={
    "description": "Create a customer service workflow that searches our knowledge base and provides personalized responses",
    "preferences": {
        "complexity": "moderate",
        "optimize_for": "quality"
    }
})

workflow = response.json()
print(f"Quality Score: {workflow['quality_score']}/100")
print(f"DSL:\n{workflow['dsl']}")
```

---

## 🎯 Success Metrics

### Target KPIs

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Generation Success Rate | >90% | - | 🚧 In Dev |
| Quality Score (Avg) | >85/100 | - | 🚧 In Dev |
| Generation Time (P95) | <30s | - | 🚧 In Dev |
| User Satisfaction | >4.2/5.0 | - | 🚧 In Dev |
| Token Efficiency | <8000/workflow | - | 🚧 In Dev |

---

## 🛣️ Roadmap

### Phase 0: Preparation ✅ (Week 1)
- [x] Architecture design
- [x] Project structure
- [ ] Environment setup
- [ ] Documentation framework

### Phase 1: Backend Foundation (Weeks 2-3)
- [ ] Core services (LLM, Vector Store, DSL generation)
- [ ] FastAPI application
- [ ] Basic API endpoints
- [ ] Unit tests

### Phase 2: Knowledge Base & RAG (Week 4)
- [ ] Curate 6+ workflow patterns
- [ ] Embedding pipeline
- [ ] Retrieval system
- [ ] Pattern API endpoints

### Phase 3: LangGraph Agents (Weeks 5-6)
- [ ] 4 specialized agents
- [ ] Supervisor orchestration
- [ ] LangGraph state machine
- [ ] End-to-end testing

### Phase 4: Frontend (Weeks 7-8)
- [ ] Workflow canvas (React Flow)
- [ ] Generation wizard
- [ ] Pattern library browser
- [ ] DSL import/export

### Phase 5: Integration (Weeks 9-10)
- [ ] Backend-frontend integration
- [ ] Deployment preparation
- [ ] Comprehensive testing
- [ ] Documentation completion

### Phase 6: Production Launch (Weeks 11-12)
- [ ] Production deployment
- [ ] Beta user onboarding
- [ ] Feedback collection
- [ ] Rapid iteration

---

## 🤝 Contributing

DSLMaker v2 is currently in active development. Contributions are welcome once we reach Phase 3 (Weeks 5-6).

### Development Principles

1. **Separation of Concerns**: Frontend = UI, Backend = Intelligence
2. **Mock-First Nodes**: Nodes are data structures, Dify handles execution
3. **Knowledge-Driven**: RAG system learns from curated patterns
4. **Quality Over Features**: Excellent simple workflows > Poor complex ones
5. **Test-Driven**: Both unit and E2E tests required

---

## 📄 License

[MIT License](./LICENSE)

---

## 🙏 Acknowledgments

- **Dify Team** - For the excellent workflow platform
- **LangChain Team** - For LangGraph and agent frameworks
- **v1 Contributors** - Lessons learned shaped v2 architecture

---

## 📞 Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/dslmaker-v2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/dslmaker-v2/discussions)

---

**Built with ❤️ using LangGraph, FastAPI, and Next.js**