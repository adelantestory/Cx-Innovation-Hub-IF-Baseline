// =============================================================================
// Stage 4: Application Deployment
// =============================================================================
// Deploys application containers:
//   - Backend Container App (Node.js + Express API)
//   - Frontend Container App (React + Nginx)
//
// Prerequisites:
//   - Stage 1: Managed Identity, Key Vault
//   - Stage 2: PostgreSQL (connection info stored in Key Vault)
//   - Stage 3: Container Registry, Container Apps Environment
//
// Note: Container images must be built and pushed to ACR before deploying
// this stage. The deployment script handles image building.
// =============================================================================

@description('Unique identifier for resource naming')
param uid string

@description('Azure region for deployment')
param location string

@description('Environment (dev, stg, prd)')
@allowed(['dev', 'stg', 'prd'])
param environment string = 'dev'

@description('Resource ID of the Container Apps Environment')
param environmentId string

@description('Container Registry login server')
param registryLoginServer string

@description('Resource ID of the User-Assigned Managed Identity')
param managedIdentityId string

@description('Client ID of the User-Assigned Managed Identity')
param managedIdentityClientId string

@description('Key Vault URI for secret retrieval')
param keyVaultUri string

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var baseTags = {
  Environment: environment
  Stage: 'application'
  Purpose: 'Taskify POC'
}

// ---------------------------------------------------------------------------
// Backend Container App (API)
// ---------------------------------------------------------------------------
module containerAppApi 'modules/container-app.bicep' = {
  name: 'container-app-api-${uid}'
  params: {
    name: 'ca-${uid}-taskify-api'
    location: location
    tags: baseTags
    environmentId: environmentId
    registryServer: registryLoginServer
    imageName: 'taskify-api'
    imageTag: 'latest'
    targetPort: 3000
    externalIngress: true
    minReplicas: 0
    maxReplicas: 1
    cpu: '0.25'
    memory: '0.5Gi'
    managedIdentityId: managedIdentityId
    envVars: [
      { name: 'NODE_ENV', value: 'production' }
      { name: 'PORT', value: '3000' }
      { name: 'AZURE_KEY_VAULT_URL', value: keyVaultUri }
      { name: 'AZURE_CLIENT_ID', value: managedIdentityClientId }
      { name: 'PGDATABASE', value: 'taskify' }
      { name: 'PGPORT', value: '5432' }
      { name: 'PGSSLMODE', value: 'require' }
    ]
  }
}

// ---------------------------------------------------------------------------
// Frontend Container App (Web)
// ---------------------------------------------------------------------------
module containerAppWeb 'modules/container-app.bicep' = {
  name: 'container-app-web-${uid}'
  params: {
    name: 'ca-${uid}-taskify-web'
    location: location
    tags: baseTags
    environmentId: environmentId
    registryServer: registryLoginServer
    imageName: 'taskify-web'
    imageTag: 'latest'
    targetPort: 80
    externalIngress: true
    minReplicas: 0
    maxReplicas: 1
    cpu: '0.25'
    memory: '0.5Gi'
    managedIdentityId: managedIdentityId
    envVars: [
      { name: 'VITE_API_URL', value: containerAppApi.outputs.url }
    ]
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output containerAppApiId string = containerAppApi.outputs.id
output containerAppApiName string = containerAppApi.outputs.name
output containerAppApiFqdn string = containerAppApi.outputs.fqdn
output containerAppApiUrl string = containerAppApi.outputs.url

output containerAppWebId string = containerAppWeb.outputs.id
output containerAppWebName string = containerAppWeb.outputs.name
output containerAppWebFqdn string = containerAppWeb.outputs.fqdn
output containerAppWebUrl string = containerAppWeb.outputs.url
