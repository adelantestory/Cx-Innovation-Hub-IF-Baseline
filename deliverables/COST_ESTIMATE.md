# Taskify - Azure Cost Estimate

## Current Architecture SKUs

Based on the architecture defined for the Taskify POC deployed in the US West 3 region.

### Core Services

| Resource | SKU | Configuration |
|----------|-----|---------------|
| Azure Database for PostgreSQL Flexible Server | Burstable B1ms | 1 vCore, 2 GiB RAM, 32 GiB storage, v16 |
| Azure Container Apps (API) | Consumption | 0.25 vCPU, 0.5 GiB, 0-1 replicas |
| Azure Container Apps (Web) | Consumption | 0.25 vCPU, 0.5 GiB, 0-1 replicas |
| Azure Container Apps Environment | Consumption | No zone redundancy |

### Ancillary Services

| Resource | SKU | Configuration |
|----------|-----|---------------|
| Azure Key Vault | Standard | RBAC authorization, soft delete enabled |
| Azure Container Registry | Basic | 10 GiB storage included |
| Azure Log Analytics Workspace | PerGB2018 | 30-day retention (5 GB/month free tier) |
| User-Assigned Managed Identity | N/A | No cost |

---

## Cost Scenarios

### Scenario 1: Development/POC (Low Usage)

**Assumptions:**
- 1-3 developers actively testing the application
- Application used during business hours only (~8 hours/day, ~22 days/month)
- Container Apps scale to zero when not in use
- Approximately 500-1,000 API requests per day during active use
- PostgreSQL storage usage under 5 GiB
- Log Analytics ingestion under 5 GB/month (free tier)

**Limitations:**
- Cold start latency of 10-15 seconds when Container Apps scale from zero
- Burstable B1ms PostgreSQL has limited compute; may experience slowness under concurrent load
- Basic Container Registry has no geo-replication (single region only)
- No automated backups beyond the 7-day default retention

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| **PostgreSQL Flexible Server (B1ms)** | $12.41 | Burstable B1ms: ~$0.017/hour x 730 hours |
| **PostgreSQL Storage (32 GiB)** | $4.10 | $0.128/GiB/month x 32 GiB |
| **Container Apps (API)** | $0.50 - $2.00 | ~176 active hours x 0.25 vCPU. First 180K vCPU-sec free, first 360K GiB-sec free |
| **Container Apps (Web)** | $0.50 - $2.00 | ~176 active hours x 0.25 vCPU. Similar to API |
| **Container Registry (Basic)** | $5.00 | Fixed monthly fee |
| **Key Vault** | $0.10 - $0.50 | $0.03/10K operations. Low volume for secret reads |
| **Log Analytics** | $0.00 | Under 5 GB/month free ingestion allowance |
| **Managed Identity** | $0.00 | No cost |

**POC Monthly Total: ~$23 - $26**

---

### Scenario 2: Pilot (Medium Usage)

**Assumptions:**
- 10-20 team members actively using the application
- Application used throughout business hours (~10 hours/day, ~22 days/month)
- Container Apps maintain at least 1 replica during business hours
- Approximately 5,000-10,000 API requests per day
- PostgreSQL storage usage 5-10 GiB
- Log Analytics ingestion 5-10 GB/month

**Limitations:**
- Burstable B1ms may show performance degradation with 20 concurrent users
- Single replica Container Apps cannot handle burst traffic well
- No high availability on PostgreSQL (single zone)
- Comment threading queries may become slow with large comment volumes

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| **PostgreSQL Flexible Server (B1ms)** | $12.41 | Same tier; consider upgrading to B2s for concurrent users |
| **PostgreSQL Storage (32 GiB)** | $4.10 | $0.128/GiB/month x 32 GiB |
| **Container Apps (API)** | $5.00 - $15.00 | ~220 active hours x 0.25 vCPU, higher request volume |
| **Container Apps (Web)** | $3.00 - $8.00 | ~220 active hours x 0.25 vCPU, static serving |
| **Container Registry (Basic)** | $5.00 | Fixed monthly fee |
| **Key Vault** | $0.30 - $1.00 | Increased secret reads from more Container App instances |
| **Log Analytics** | $0.00 - $11.50 | 5 GB free, then $2.30/GB for additional ingestion |
| **Managed Identity** | $0.00 | No cost |

**Pilot Monthly Total: ~$30 - $57**

---

### Scenario 3: Production (High Usage)

**Assumptions:**
- 50-100 active users across multiple teams
- Application used 24/7 with peak during business hours
- Container Apps scaled to 3-5 replicas during peak
- Approximately 50,000-100,000 API requests per day
- PostgreSQL upgraded to General Purpose D2s_v3 for consistent performance
- PostgreSQL storage usage 20-50 GiB
- Log Analytics ingestion 20-50 GB/month
- High availability enabled on PostgreSQL

**Limitations:**
- Requires architecture changes (upgrade PostgreSQL tier, increase Container App replicas)
- May need PgBouncer or similar connection pooling at this scale
- Should implement Application Insights for distributed tracing
- CORS and security headers need hardening
- Real-time collaboration features (WebSockets) would increase costs further

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| **PostgreSQL Flexible Server (D2s_v3)** | $98.55 | General Purpose: ~$0.135/hour x 730 hours |
| **PostgreSQL Storage (64 GiB)** | $8.19 | $0.128/GiB/month x 64 GiB |
| **PostgreSQL HA (Zone Redundant)** | $98.55 | Doubles compute cost for standby |
| **Container Apps (API, 3 replicas)** | $30.00 - $60.00 | 3 replicas x 0.5 vCPU, 730 hours |
| **Container Apps (Web, 2 replicas)** | $15.00 - $30.00 | 2 replicas x 0.25 vCPU, 730 hours |
| **Container Registry (Standard)** | $20.00 | Upgraded for webhooks and increased storage |
| **Key Vault** | $1.00 - $3.00 | Higher operation volume |
| **Log Analytics** | $34.50 - $103.50 | 15-45 GB beyond free tier at $2.30/GB |
| **Application Insights** | $5.00 - $15.00 | Added for production monitoring |
| **Azure Front Door (Optional)** | $35.00 | WAF and global load balancing |

**Production Monthly Total: ~$346 - $473**

---

## Cost Breakdown by Category

### Database (50-55% of POC total)
- PostgreSQL Flexible Server compute: Primary cost driver at POC tier
- PostgreSQL storage: Fixed cost based on provisioned size

### Compute (15-20% of POC total)
- Container Apps (API): Variable based on active hours and request volume
- Container Apps (Web): Variable based on active hours

### Registry & Storage (20-25% of POC total)
- Container Registry: Fixed monthly fee for Basic SKU

### Security & Monitoring (5-10% of POC total)
- Key Vault: Minimal cost for low-volume secret access
- Log Analytics: Free tier covers POC workloads

---

## Cost Optimization Recommendations

### Immediate Savings

1. **Stop PostgreSQL when not in use**
   - Current: Running 24/7 (~$12.41/month)
   - Recommended: Stop server during off-hours via Azure CLI or automation
   - Estimated savings: **$4-6/month** (if stopped 12+ hours/day)
   - Trade-off: Manual start/stop required; ~1 minute startup time

2. **Container Apps scale-to-zero**
   - Current: Already configured for 0 minimum replicas
   - Benefit: No compute charges when idle
   - Trade-off: Cold start latency of 10-15 seconds on first request

3. **Log Analytics free tier**
   - Current: Already within free 5 GB/month allowance for POC
   - Recommended: Monitor ingestion volume; set daily cap if approaching limit
   - Estimated savings: **Avoids $2.30/GB overages**

### Production Optimizations

1. **PostgreSQL Reserved Capacity**
   - 1-year reserved compute: ~35% savings on General Purpose tier
   - 3-year reserved compute: ~55% savings on General Purpose tier
   - Break-even: ~2 months for 1-year reservation

2. **Container Apps Environment Profiles**
   - Use workload profiles for more predictable pricing at scale
   - Dedicated plan for consistent workloads vs. consumption for burst

3. **Database Connection Pooling**
   - Implement PgBouncer to reduce connection overhead
   - Allows lower PostgreSQL tier to serve more concurrent users
   - Estimated savings: **Defer PostgreSQL upgrade by optimizing connections**

---

## PostgreSQL Detailed Costs

PostgreSQL is the primary cost driver for this architecture, representing over half the monthly cost at POC scale.

### Pricing (US West 3, Pay-As-You-Go)

| Tier | SKU | vCores | RAM | Cost/Hour | Cost/Month (730h) |
|------|-----|--------|-----|-----------|-------------------|
| Burstable | B1ms | 1 | 2 GiB | $0.017 | $12.41 |
| Burstable | B2s | 2 | 4 GiB | $0.034 | $24.82 |
| General Purpose | D2s_v3 | 2 | 8 GiB | $0.135 | $98.55 |
| General Purpose | D4s_v3 | 4 | 16 GiB | $0.270 | $197.10 |

### Storage Pricing

| Storage Size | Cost/Month |
|-------------|-----------|
| 32 GiB | $4.10 |
| 64 GiB | $8.19 |
| 128 GiB | $16.38 |
| 256 GiB | $32.77 |

### Backup Storage

- Included backup storage equals provisioned server storage (32 GiB for POC)
- Additional backup storage: $0.095/GiB/month

---

## Monthly Cost Summary Table

| Usage Level | Active Users | Estimated Monthly Cost |
|-------------|-------------|------------------------|
| POC (current) | 1-3 | $23 - $26 |
| Light Pilot | 5-10 | $27 - $40 |
| Full Pilot | 10-20 | $30 - $57 |
| Production (Low) | 20-50 | $150 - $250 |
| Production (Medium) | 50-100 | $346 - $473 |
| Production (High) | 100+ | $500+ (requires architecture review) |

---

## Cost Monitoring Recommendations

1. **Set up Azure Cost Alerts**
   - Budget alerts at 50%, 75%, 90% of expected monthly spend
   - Anomaly detection enabled for unexpected cost spikes

2. **Tag Resources**
   - Environment: dev
   - Purpose: Taskify POC
   - Stage: foundation / data / compute (per deployment stage)

3. **Review Weekly**
   - Azure Advisor cost recommendations
   - PostgreSQL compute utilization (right-size if consistently under 20%)
   - Container Apps active hours (verify scale-to-zero is working)
   - Log Analytics ingestion volume

---

## Alternative Architectures (Cost Reduction)

### Option A: Azure App Service instead of Container Apps
- Change: Deploy frontend and backend to Azure App Service (Free or Basic tier)
- Saves: ~$1-5/month on compute at POC scale (Free tier available)
- Trade-off: Less flexible scaling, no scale-to-zero on Basic tier, different deployment model. Container Apps better aligns with container-based deployment goals.

### Option B: Single Container App (combined frontend + backend)
- Change: Serve React static files from Express.js (no separate Nginx container)
- Saves: ~$1-3/month (one fewer Container App)
- Trade-off: Coupled deployment lifecycle, cannot independently scale frontend and backend. Simplifies architecture but limits future flexibility.

### Option C: Azure Database for PostgreSQL Single Server (deprecated)
- Change: Use older Single Server tier
- Saves: Not recommended -- Single Server is on deprecation path
- Trade-off: No long-term support. Flexible Server is the correct choice.

---

## Assumptions & Disclaimers

1. All prices are based on US West 3 region pricing as of February 2026
2. Prices are subject to change; verify with the [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
3. Actual costs may vary based on usage patterns, especially Container Apps active time
4. Reserved instance and commitment discounts are not included unless specified
5. Data transfer costs between Azure services in the same region are not included (free for intra-region)
6. Microsoft internal subscription pricing may differ from public pricing; estimates use public rates
7. Container Apps consumption pricing includes free monthly grants: 180,000 vCPU-seconds and 360,000 GiB-seconds
8. PostgreSQL is billed continuously while the server is running, regardless of query activity

---

*Last updated: 2026-02-12*
*Prices based on US West 3 region, subject to change*
