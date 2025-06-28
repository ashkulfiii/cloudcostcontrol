<#
.SYNOPSIS
This script sets up cost management by Savionyx.
https://login.microsoftonline.com/{tenantId}/adminconsent?client_id={clientId}

.DESCRIPTION
Creates a resource group with a storage account used for cost exports.
Assigns owner role at the resource group level.
Assigns billing reader role at the tenant scope.

.PARAMETER SubscriptionId
Azure Subscription ID where the resources will be created.

.PARAMETER TenantId
Azure Tenant ID where the roles will be assigned.

.EXAMPLE
# Example of how to execute the script with parameters
.\savionyx.ps1 -SubscriptionId "00000000-0000-0000-0000-000000000000" -TenantId "11111111-1111-1111-1111-111111111111"
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    [Parameter(Mandatory=$true)]
    [string]$TenantId
)

# Login to Azure using the provided subscription ID and tenant ID
Connect-AzAccount -SubscriptionId $SubscriptionId -TenantId $TenantId

# Savionyx object ID & Admin consent
$objectId = Get-AzADServicePrincipal -DisplayName "Savionyx" | Select-Object -ExpandProperty Id
Start-Process "https://login.microsoftonline.com/$TenantId/adminconsent?client_id=${$objectId}"

# Create the resource group
$resourceGroupName = "rg-savionyx-$TenantId"
New-AzResourceGroup -Name $resourceGroupName -Location "EastUS" -Force

# Create the storage account in the resource group
$storageAccountName = "sa" + $TenantId.Substring(0, 8)
New-AzStorageAccount -ResourceGroupName $resourceGroupName `
    -Name $storageAccountName `
    -SkuName "Standard_LRS" `
    -Location "EastUS" `
    -Kind "StorageV2"

# Assign Owner role at the resource group level
New-AzRoleAssignment -ObjectId $objectId `
    -RoleDefinitionName "Contributor" `
    -Scope "/subscriptions/$SubscriptionId/resourceGroups/$resourceGroupName"

# Assign Billing Reader role at the tenant scope
New-AzRoleAssignment -ObjectId $objectId `
    -RoleDefinitionName "Cost Management Contributor" `
    -Scope "/providers/Microsoft.Management/managementGroups/$TenantId"

Write-Output "Admin consent granted to  $objectId."
Write-Output "Resource group '$resourceGroupName' and storage account '$storageAccountName' created."
Write-Output "Roles Contributor & Cost Management Contributor assigned to object ID $objectId."
