// =============================================================================
// Azure Database for PostgreSQL Flexible Server Module
// =============================================================================
// Creates a PostgreSQL Flexible Server with a database for the Taskify
// application. The admin password is passed as a secure parameter and stored
// in Key Vault by the deployment script.
//
// Firewall rule allows all Azure services to connect (required for Container
// Apps). SSL is enforced on all connections.
// =============================================================================

@description('Resource name for the PostgreSQL Flexible Server')
param name string

@description('Azure region for deployment')
param location string

@description('SKU name (e.g., Standard_B1ms)')
param skuName string = 'Standard_B1ms'

@description('SKU tier (Burstable, GeneralPurpose, MemoryOptimized)')
@allowed(['Burstable', 'GeneralPurpose', 'MemoryOptimized'])
param skuTier string = 'Burstable'

@description('PostgreSQL major version')
param version string = '16'

@description('Storage size in GiB')
param storageSizeGB int = 32

@description('Backup retention period in days')
param backupRetentionDays int = 7

@description('Administrator username')
param adminUsername string

@description('Administrator password')
@secure()
param adminPassword string

@description('Database name to create')
param databaseName string = 'taskify'

@description('Tags to apply to the resource')
param tags object

// ---------------------------------------------------------------------------
// PostgreSQL Flexible Server
// ---------------------------------------------------------------------------
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: version
    administratorLogin: adminUsername
    administratorLoginPassword: adminPassword
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

// ---------------------------------------------------------------------------
// Firewall Rule: Allow Azure Services
// ---------------------------------------------------------------------------
resource firewallAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the PostgreSQL Flexible Server')
output id string = postgresServer.id

@description('Name of the PostgreSQL Flexible Server')
output name string = postgresServer.name

@description('Fully qualified domain name of the PostgreSQL server')
output fqdn string = postgresServer.properties.fullyQualifiedDomainName

@description('Name of the database')
output databaseName string = database.name
