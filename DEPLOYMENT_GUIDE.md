# DSLMaker v2 - Deployment Guide

**Version**: 2.0.0-alpha
**Last Updated**: 2025-10-01

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Observability](#monitoring--observability)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- **OpenAI API Account**: Required for LLM and embedding generation
  - API Key with access to GPT-4 or GPT-4o-mini
  - Sufficient credits for production usage

### System Requirements

**Backend**:
- Python 3.11 or higher
- 2GB RAM minimum (4GB recommended)
- 1GB storage for ChromaDB

**Frontend**:
- Node.js 18+ or Bun
- 1GB RAM minimum
- Modern browser (Chrome, Firefox, Safari, Edge)

---

## Local Development

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Or use uv (faster)
uv pip install -e ".[dev]"

# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env
```

**Required `.env` Configuration**:
```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
ENVIRONMENT=development
```

**Start Backend Server**:
```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the script
python -m uvicorn app.main:app --reload
```

**Access**:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Required `.env.local` Configuration**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Start Frontend Server**:
```bash
# Development mode
npm run dev

# Or using the clean script
npm run dev:clean
```

**Access**:
- Frontend: http://localhost:3000

---

## Docker Deployment

### 1. Backend Docker Build

```bash
cd backend

# Build Docker image
docker build -t dslmaker-backend:latest .

# Or use docker-compose
docker-compose up -d
```

### 2. Environment Configuration

Create `.env.production` file:
```bash
cp .env.production.example .env.production
nano .env.production
```

**Critical Settings**:
```bash
ENVIRONMENT=production
OPENAI_API_KEY=sk-your-production-api-key
CORS_ORIGINS=https://your-frontend-domain.com
LOG_LEVEL=INFO
```

### 3. Run with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Health Check

```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "api": "operational",
    "chromadb": "operational",
    "llm": "operational",
    "agents": "operational"
  }
}
```

---

## Production Deployment

### Option 1: Railway Deployment (Backend)

**Recommended for backend deployment**

1. **Create Railway Account**: https://railway.app

2. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

3. **Deploy Backend**:
```bash
cd backend
railway init
railway link
```

4. **Set Environment Variables in Railway Dashboard**:
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4o-mini`
- `ENVIRONMENT=production`
- `CORS_ORIGINS=https://your-frontend.vercel.app`

5. **Deploy**:
```bash
railway up
```

**Estimated Cost**: $5-20/month depending on usage

### Option 2: Render Deployment (Backend)

1. **Create Render Account**: https://render.com

2. **Create New Web Service**:
- Connect GitHub repository
- Select `backend` directory
- Build command: `pip install -e .`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**:
- Add `OPENAI_API_KEY`
- Add `OPENAI_MODEL`
- Add `CORS_ORIGINS`

4. **Deploy**: Render auto-deploys on git push

**Estimated Cost**: $7-25/month

### Option 3: Vercel Deployment (Frontend)

**Recommended for frontend deployment**

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy Frontend**:
```bash
cd frontend
vercel login
vercel
```

3. **Set Environment Variables in Vercel Dashboard**:
- `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`

4. **Production Deployment**:
```bash
vercel --prod
```

**Estimated Cost**: Free for personal projects

### Option 4: Self-Hosted (VPS)

**For Ubuntu/Debian VPS**:

```bash
# Install dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv nginx certbot

# Clone repository
git clone https://github.com/yourusername/dslmaker-v2.git
cd dslmaker-v2/backend

# Set up backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .

# Create systemd service
sudo nano /etc/systemd/system/dslmaker.service
```

**Systemd Service File**:
```ini
[Unit]
Description=DSLMaker Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/dslmaker-v2/backend
Environment="PATH=/path/to/dslmaker-v2/backend/.venv/bin"
EnvironmentFile=/path/to/dslmaker-v2/backend/.env.production
ExecStart=/path/to/dslmaker-v2/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

**Start Service**:
```bash
sudo systemctl enable dslmaker
sudo systemctl start dslmaker
sudo systemctl status dslmaker
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**SSL with Certbot**:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4` | LLM model to use |
| `OPENAI_EMBEDDING_MODEL` | No | `text-embedding-3-small` | Embedding model |
| `ENVIRONMENT` | No | `development` | Environment mode |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed CORS origins |
| `RATE_LIMIT_ENABLED` | No | `true` | Enable rate limiting |
| `RATE_LIMIT_REQUESTS` | No | `100` | Max requests per period |
| `RATE_LIMIT_PERIOD` | No | `60` | Rate limit period (seconds) |

### Optional: Advanced Configuration

**LangSmith Monitoring** (Recommended for production):
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-api-key
LANGCHAIN_PROJECT=dslmaker-v2-production
```

**Sentry Error Tracking**:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

## Monitoring & Observability

### 1. Token Usage Monitoring

**Endpoint**: `GET /api/v1/generate/usage`

```bash
curl http://localhost:8000/api/v1/generate/usage
```

**Response**:
```json
{
  "usage_stats": {
    "total_requests": 42,
    "total_tokens": 125430,
    "total_prompt_tokens": 85200,
    "total_completion_tokens": 40230,
    "estimated_cost_usd": 0.1523,
    "avg_tokens_per_request": 2986.43,
    "requests_by_model": {
      "gpt-4o-mini": 42
    },
    "tracking_since": "2025-10-01T10:00:00"
  }
}
```

### 2. Health Monitoring

**Endpoint**: `GET /health`

Set up monitoring alerts for:
- API response time > 5s
- Error rate > 5%
- Health check failures

### 3. LangSmith (Recommended)

1. **Sign up**: https://smith.langchain.com
2. **Get API key**: Settings → API Keys
3. **Configure environment**:
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-key
LANGCHAIN_PROJECT=dslmaker-v2
```

4. **View traces**: https://smith.langchain.com/

### 4. Log Aggregation

**Structured Logging**: Already implemented in backend

**Cloud Logging Options**:
- **Railway/Render**: Built-in log viewer
- **Self-hosted**: Use Loki + Grafana
- **Cloud**: CloudWatch (AWS), Cloud Logging (GCP)

---

## Troubleshooting

### Common Issues

#### 1. "ChromaDB connection failed"

**Cause**: ChromaDB directory not writable

**Solution**:
```bash
# Ensure data directory exists and is writable
mkdir -p data/chroma
chmod 755 data/chroma

# Check Docker volume permissions
docker-compose down
docker volume rm dslmaker_chroma-data
docker-compose up -d
```

#### 2. "OpenAI API authentication failed"

**Cause**: Invalid or missing API key

**Solution**:
```bash
# Check environment variable
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### 3. "CORS error from frontend"

**Cause**: Frontend domain not in CORS_ORIGINS

**Solution**:
```bash
# Update backend .env
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000

# Restart backend
```

#### 4. "Rate limit exceeded (429)"

**Cause**: Too many requests from same IP

**Solution**:
```bash
# Disable rate limiting (development only)
RATE_LIMIT_ENABLED=false

# Or increase limits
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_PERIOD=60
```

#### 5. High token usage / costs

**Solution**:
```bash
# Switch to cheaper model
OPENAI_MODEL=gpt-4o-mini

# Monitor usage
curl http://localhost:8000/api/v1/generate/usage

# Reset statistics
curl -X POST http://localhost:8000/api/v1/generate/usage/reset
```

### Performance Optimization

1. **Use gpt-4o-mini** instead of gpt-4 (15x cheaper)
2. **Enable caching** for pattern retrieval
3. **Use Pinecone** instead of ChromaDB for production
4. **Scale workers**: Increase Uvicorn workers for high load
   ```bash
   uvicorn app.main:app --workers 4
   ```

### Getting Help

- **Issues**: https://github.com/yourusername/dslmaker-v2/issues
- **Documentation**: See `README.md` and `IMPLEMENTATION_REVIEW_REPORT.md`
- **Email**: your-email@example.com

---

## Security Best Practices

1. ✅ **Never commit** `.env` files to git
2. ✅ **Use strong SECRET_KEY** in production
3. ✅ **Enable HTTPS** for all production deployments
4. ✅ **Restrict CORS_ORIGINS** to your frontend domain only
5. ✅ **Enable rate limiting** in production
6. ✅ **Monitor API costs** regularly
7. ✅ **Keep dependencies updated**: `pip list --outdated`

---

## Next Steps After Deployment

1. ✅ Test all workflows with real user scenarios
2. ✅ Set up monitoring dashboards
3. ✅ Configure automatic backups for ChromaDB data
4. ✅ Set up error alerting (Sentry/PagerDuty)
5. ✅ Document API for end users
6. ✅ Create video tutorials
7. ✅ Gather user feedback

---

**Deployment Status**: Ready for production
**Support**: Community-supported
**License**: See LICENSE file

---

*Last Updated: 2025-10-01*
