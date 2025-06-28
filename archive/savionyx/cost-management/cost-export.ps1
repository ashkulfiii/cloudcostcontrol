param (
    [string]$TenantId,
    [string]$SubscriptionId
)

# Build a credentials object to sign in to user tenant
$ClientId = "a5573a35-dca7-46e9-8a65-9a70366c6de6"
$ClientSecret = "iUC8Q~AcYk.zqqT-po4NOW1VEaAKFB~qp~GMObg." | ConvertTo-SecureString -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($ClientId, $ClientSecret)

# Login to Azure using the provided subscription ID and tenant ID
Connect-AzAccount -ServicePrincipal -Tenant $TenantId -SubscriptionId $SubscriptionId -Credential $Credential

$storageAccountName = "sa" + $TenantId.Substring(0, 8)

New-AzCostManagementExport -Scope "/subscriptions/$SubscriptionId" `
    -Name "CostManagementExportTest" `
    -ScheduleStatus "Active" `
    -ScheduleRecurrence "Daily" `
    -RecurrencePeriodFrom "2024-12-23T00:00:00Z" `
    -RecurrencePeriodTo "2030-12-23T00:00:00Z" `
    -Format "Csv" `
    -DestinationResourceId "/subscriptions/$SubscriptionId/resourceGroups/rg-savionyx-$TenantId/providers/Microsoft.Storage/storageAccounts/$storageAccountName" `
    -DestinationContainer "exports" `
    -DestinationRootFolderPath "ad-hoc" `
    -DefinitionType "Usage" `
    -DefinitionTimeframe "MonthToDate" `
    -DatasetGranularity "Daily"

Invoke-AzCostManagementExecuteExport -ExportName 'CostManagementExportTest' -Scope "/subscriptions/$SubscriptionId"

$rgName = "rg-savionyx-$TenantId"
$accountName = $storageAccountName
$storageAccount = Get-AzStorageAccount -ResourceGroupName $rgName -Name $accountName
$connectionString = $storageAccount.Context.ConnectionString

echo $connectionString