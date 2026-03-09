// =============================================================================
// Azure Container App Module
// =============================================================================
// Creates an individual Container App within a Container Apps Environment.
// Supports optional User-Assigned Managed Identity assignment and
// configurable environment variables, ingress, and scaling.
//
// This module is reusable for both the backend API and frontend web apps.
// =============================================================================

@description('Resource name for the Container App')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to the resource')
param tags object

@description('Resource ID of the Container Apps Environment')
param environmentId string

@description('Container Registry login server (e.g., crXXXtaskifydev.azurecr.io)')
param registryServer string

@description('Container image name (e.g., taskify-api)')
param imageName string

@description('Container image tag')
param imageTag string = 'latest'

@description('Target port the container listens on')
param targetPort int

@description('Enable external ingress (accessible from internet)')
param externalIngress bool = true

@description('Minimum number of replicas')
param minReplicas int = 0

@description('Maximum number of replicas')
param maxReplicas int = 1

@description('CPU allocation in cores')
param cpu string = '0.25'

@description('Memory allocation')
param memory string = '0.5Gi'

@description('Resource ID of the User-Assigned Managed Identity (empty string to skip)')
param managedIdentityId string = ''

@description('Environment variables for the container')
param envVars array = []

// ---------------------------------------------------------------------------
// Container App
// ---------------------------------------------------------------------------
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: tags
  identity: empty(managedIdentityId) ? {
    type: 'None'
  } : {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: empty(managedIdentityId) ? [] : [
        {
          server: registryServer
          identity: managedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: name
          image: '${registryServer}/${imageName}:${imageTag}'
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: envVars
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Container App')
output id string = containerApp.id

@description('Name of the Container App')
output name string = containerApp.name

@description('FQDN of the Container App')
output fqdn string = containerApp.properties.configuration.ingress.fqdn

@description('URL of the Container App')
output url string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
