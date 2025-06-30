---
title: "Mastering Azure Cost Control with PowerShell: Advanced Automation Scripts"
pubDate: 2025-10-01
description: "Learn to build powerful PowerShell scripts for automated Azure cost monitoring, optimization, and reporting. Complete with real-world examples and best practices."
author: "Cloud Cost Control Team"
tags: ["azure", "powershell", "automation", "cost-optimization", "scripting"]
---

# Mastering Azure Cost Control with PowerShell: Advanced Automation Scripts

PowerShell is one of the most powerful tools for Azure cost management automation. This comprehensive guide will teach you to build sophisticated cost control systems using PowerShell scripts that can save your organization thousands of dollars monthly.

## Why PowerShell for Azure Cost Management?

PowerShell offers unique advantages for cost automation:

- **Native Azure integration** with Az PowerShell module
- **Rich data manipulation** capabilities for cost analysis
- **Scheduled execution** through Azure Automation or Task Scheduler
- **Email and Teams integration** for automated reporting
- **Complex logic support** for advanced optimization scenarios

## Essential PowerShell Modules for Cost Management

```powershell
# Install required modules
Install-Module -Name Az -Force -AllowClobber
Install-Module -Name Az.CostManagement -Force
Install-Module -Name Az.ResourceGraph -Force
Install-Module -Name ImportExcel -Force
```

## 1. Automated Daily Cost Monitoring Script

This script monitors daily spend and alerts when thresholds are exceeded:

```powershell
#Requires -Module Az.CostManagement, Az.Accounts

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [decimal]$DailyThreshold,
    
    [Parameter(Mandatory=$true)]
    [string]$EmailRecipient,
    
    [string]$SMTPServer = "smtp.office365.com",
    [int]$SMTPPort = 587
)

# Connect to Azure
Connect-AzAccount -Identity # Use this for Azure Automation

# Get yesterday's costs
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
$today = (Get-Date).ToString("yyyy-MM-dd")

$costParams = @{
    Scope = "/subscriptions/$SubscriptionId"
    Timeframe = "Custom"
    TimePeriodFrom = $yesterday
    TimePeriodTo = $today
    Granularity = "Daily"
    GroupBy = @(@{Type="Dimension"; Name="ServiceName"})
}

try {
    $costs = Get-AzCostManagementUsageDetail @costParams
    $totalDailyCost = ($costs | Measure-Object -Property Cost -Sum).Sum
    
    Write-Host "Daily cost for $yesterday`: $$$totalDailyCost"
    
    if ($totalDailyCost -gt $DailyThreshold) {
        # Prepare detailed breakdown
        $breakdown = $costs | Group-Object ServiceName | 
            Select-Object Name, @{N="Cost";E={($_.Group | Measure-Object -Property Cost -Sum).Sum}} |
            Sort-Object Cost -Descending | 
            Select-Object -First 10
        
        $body = @"
⚠️ AZURE COST ALERT ⚠️

Daily spending threshold exceeded!
- Date: $yesterday
- Total Cost: $$$($totalDailyCost.ToString("F2"))
- Threshold: $$$($DailyThreshold.ToString("F2"))
- Overage: $$$((($totalDailyCost - $DailyThreshold).ToString("F2")))

Top Services by Cost:
$($breakdown | ForEach-Object { "• $($_.Name): $$$($_.Cost.ToString('F2'))" } | Out-String)

Please review your Azure resources immediately.
"@

        # Send alert email
        Send-MailMessage -To $EmailRecipient -Subject "🚨 Azure Daily Cost Threshold Exceeded" -Body $body -SmtpServer $SMTPServer -Port $SMTPPort -UseSsl
        
        Write-Warning "Cost threshold exceeded! Alert email sent."
    }
    
} catch {
    Write-Error "Failed to retrieve cost data: $($_.Exception.Message)"
    
    # Send error notification
    $errorBody = "Failed to retrieve Azure cost data. Please check the cost monitoring script."
    Send-MailMessage -To $EmailRecipient -Subject "❌ Azure Cost Monitoring Error" -Body $errorBody -SmtpServer $SMTPServer -Port $SMTPPort -UseSsl
}
```

## 2. Weekly Cost Optimization Scanner

This advanced script identifies optimization opportunities:

```powershell
#Requires -Module Az.ResourceGraph, Az.Compute, Az.Resources

param(
    [Parameter(Mandatory=$true)]
    [string[]]$SubscriptionIds,
    
    [string]$OutputPath = "C:\temp\AzureOptimization.xlsx"
)

function Get-UnderutilizedVMs {
    param([string[]]$Subscriptions)
    
    $query = @"
    Resources
    | where type == "microsoft.compute/virtualmachines"
    | where properties.hardwareProfile.vmSize contains "Standard_"
    | extend vmSize = properties.hardwareProfile.vmSize
    | extend powerState = properties.extended.instanceView.powerState.displayStatus
    | where powerState == "VM running"
    | project subscriptionId, resourceGroup, name, vmSize, location, powerState
"@
    
    $vms = Search-AzGraph -Query $query -Subscription $Subscriptions
    
    $underutilized = @()
    
    foreach ($vm in $vms) {
        # Get CPU metrics for last 7 days
        $metricParams = @{
            ResourceId = "/subscriptions/$($vm.subscriptionId)/resourceGroups/$($vm.resourceGroup)/providers/Microsoft.Compute/virtualMachines/$($vm.name)"
            MetricName = "Percentage CPU"
            StartTime = (Get-Date).AddDays(-7)
            EndTime = Get-Date
            TimeGrain = "01:00:00"
        }
        
        try {
            $metrics = Get-AzMetric @metricParams
            $avgCpu = ($metrics.Data | Measure-Object -Property Average -Average).Average
            
            if ($avgCpu -lt 5) {
                $underutilized += [PSCustomObject]@{
                    Subscription = $vm.subscriptionId
                    ResourceGroup = $vm.resourceGroup
                    VMName = $vm.name
                    VMSize = $vm.vmSize
                    Location = $vm.location
                    AvgCPU = [math]::Round($avgCpu, 2)
                    Recommendation = if ($avgCpu -lt 2) { "Consider deallocating" } else { "Consider downsizing" }
                    EstimatedMonthlySavings = Get-VMCostEstimate -VMSize $vm.vmSize -Location $vm.location
                }
            }
        } catch {
            Write-Warning "Could not get metrics for VM: $($vm.name)"
        }
    }
    
    return $underutilized
}

function Get-UnusedDisks {
    param([string[]]$Subscriptions)
    
    $query = @"
    Resources
    | where type == "microsoft.compute/disks"
    | where properties.diskState == "Unattached"
    | extend diskSize = properties.diskSizeGB
    | extend sku = properties.sku.name
    | project subscriptionId, resourceGroup, name, diskSize, sku, location
"@
    
    $unusedDisks = Search-AzGraph -Query $query -Subscription $Subscriptions
    
    return $unusedDisks | ForEach-Object {
        [PSCustomObject]@{
            Subscription = $_.subscriptionId
            ResourceGroup = $_.resourceGroup
            DiskName = $_.name
            SizeGB = $_.diskSize
            SKU = $_.sku
            Location = $_.location
            EstimatedMonthlyCost = Get-DiskCostEstimate -SizeGB $_.diskSize -SKU $_.sku -Location $_.location
        }
    }
}

function Get-ExpensiveResources {
    param([string[]]$Subscriptions, [int]$TopN = 20)
    
    $endDate = Get-Date
    $startDate = $endDate.AddDays(-30)
    
    $expensiveResources = @()
    
    foreach ($subscription in $Subscriptions) {
        $costParams = @{
            Scope = "/subscriptions/$subscription"
            Timeframe = "Custom"
            TimePeriodFrom = $startDate.ToString("yyyy-MM-dd")
            TimePeriodTo = $endDate.ToString("yyyy-MM-dd")
            Granularity = "None"
            GroupBy = @(@{Type="Dimension"; Name="ResourceId"})
        }
        
        try {
            $costs = Get-AzCostManagementUsageDetail @costParams | 
                Sort-Object Cost -Descending | 
                Select-Object -First $TopN
            
            $expensiveResources += $costs
        } catch {
            Write-Warning "Could not get cost data for subscription: $subscription"
        }
    }
    
    return $expensiveResources
}

# Main execution
Write-Host "Starting Azure Cost Optimization Scan..." -ForegroundColor Green

$results = @{
    UnderutilizedVMs = Get-UnderutilizedVMs -Subscriptions $SubscriptionIds
    UnusedDisks = Get-UnusedDisks -Subscriptions $SubscriptionIds
    ExpensiveResources = Get-ExpensiveResources -Subscriptions $SubscriptionIds
}

# Export to Excel
$excel = $results.UnderutilizedVMs | Export-Excel -Path $OutputPath -WorksheetName "Underutilized VMs" -PassThru
$results.UnusedDisks | Export-Excel -ExcelPackage $excel -WorksheetName "Unused Disks"
$results.ExpensiveResources | Export-Excel -ExcelPackage $excel -WorksheetName "Expensive Resources"
Close-ExcelPackage $excel

Write-Host "Optimization report saved to: $OutputPath" -ForegroundColor Green

# Calculate total potential savings
$vmSavings = ($results.UnderutilizedVMs | Measure-Object -Property EstimatedMonthlySavings -Sum).Sum
$diskSavings = ($results.UnusedDisks | Measure-Object -Property EstimatedMonthlyCost -Sum).Sum
$totalSavings = $vmSavings + $diskSavings

Write-Host "Potential Monthly Savings: $$$($totalSavings.ToString('F2'))" -ForegroundColor Yellow
```

## 3. Advanced Budget Management with Actions

This script creates sophisticated budgets with automated responses:

```powershell
#Requires -Module Az.CostManagement, Az.Resources

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [decimal]$MonthlyBudget,
    
    [string[]]$AlertEmails,
    [string]$ActionGroupName = "CostControlActions"
)

function New-BudgetWithActions {
    param(
        [string]$Scope,
        [string]$BudgetName,
        [decimal]$Amount,
        [string[]]$Emails,
        [string]$ActionGroup
    )
    
    # Create Action Group for budget alerts
    $actionGroupParams = @{
        ResourceGroupName = "cost-management-rg"
        Name = $ActionGroup
        ShortName = "CostCtrl"
        EmailReceiver = @{
            Name = "CostAlerts"
            EmailAddress = $Emails -join ","
        }
    }
    
    try {
        New-AzActionGroup @actionGroupParams
        Write-Host "Action Group created: $ActionGroup"
    } catch {
        Write-Host "Action Group may already exist: $ActionGroup"
    }
    
    # Create budget with multiple thresholds
    $notifications = @{
        "Actual_GreaterThan_50_Percent" = @{
            Enabled = $true
            Operator = "GreaterThan"
            Threshold = 50
            ContactEmails = $Emails
            ContactRoles = @("Owner", "Contributor")
            ThresholdType = "Actual"
        }
        "Actual_GreaterThan_80_Percent" = @{
            Enabled = $true
            Operator = "GreaterThan"
            Threshold = 80
            ContactEmails = $Emails
            ContactRoles = @("Owner", "Contributor")
            ThresholdType = "Actual"
        }
        "Forecasted_GreaterThan_100_Percent" = @{
            Enabled = $true
            Operator = "GreaterThan"
            Threshold = 100
            ContactEmails = $Emails
            ContactRoles = @("Owner", "Contributor")
            ThresholdType = "Forecasted"
        }
    }
    
    $budgetParams = @{
        Scope = $Scope
        Name = $BudgetName
        Amount = $Amount
        TimeGrain = "Monthly"
        TimePeriodStartDate = (Get-Date -Day 1).ToString("yyyy-MM-dd")
        Notification = $notifications
    }
    
    try {
        New-AzCostManagementBudget @budgetParams
        Write-Host "Budget created successfully: $BudgetName" -ForegroundColor Green
    } catch {
        Write-Error "Failed to create budget: $($_.Exception.Message)"
    }
}

# Create resource group for cost management resources
$rgParams = @{
    Name = "cost-management-rg"
    Location = "East US"
}

try {
    New-AzResourceGroup @rgParams -Force
} catch {
    Write-Host "Resource group already exists or error occurred"
}

# Create the budget
$scope = "/subscriptions/$SubscriptionId"
$budgetName = "Monthly-Budget-$(Get-Date -Format 'yyyy-MM')"

New-BudgetWithActions -Scope $scope -BudgetName $budgetName -Amount $MonthlyBudget -Emails $AlertEmails -ActionGroup $ActionGroupName
```

## 4. Resource Tagging Compliance and Cost Allocation

```powershell
#Requires -Module Az.Resources, Az.ResourceGraph

param(
    [Parameter(Mandatory=$true)]
    [string[]]$SubscriptionIds,
    
    [hashtable]$RequiredTags = @{
        "CostCenter" = "Required"
        "Environment" = "Required"
        "Owner" = "Required"
        "Project" = "Required"
    }
)

function Get-UntaggedResources {
    param(
        [string[]]$Subscriptions,
        [hashtable]$Tags
    )
    
    $tagConditions = $Tags.Keys | ForEach-Object { "isempty(tags['$_'])" }
    $whereClause = $tagConditions -join " or "
    
    $query = @"
    Resources
    | where $whereClause
    | extend missingTags = pack_array(
        $($Tags.Keys | ForEach-Object { "iff(isempty(tags['$_']), '$_', '')" } -join ", ")
    )
    | extend missingTags = array_slice(missingTags, 0, array_length(missingTags))
    | project subscriptionId, resourceGroup, name, type, location, tags, missingTags
    | order by subscriptionId, resourceGroup, name
"@
    
    return Search-AzGraph -Query $query -Subscription $Subscriptions
}

function Set-BulkResourceTags {
    param(
        [object[]]$Resources,
        [hashtable]$DefaultTags
    )
    
    $updated = 0
    $failed = 0
    
    foreach ($resource in $Resources) {
        try {
            $resourceId = "/subscriptions/$($resource.subscriptionId)/resourceGroups/$($resource.resourceGroup)/providers/$($resource.type)/$($resource.name)"
            
            # Get current tags
            $currentTags = if ($resource.tags) { $resource.tags } else { @{} }
            
            # Add missing required tags with defaults
            foreach ($missingTag in $resource.missingTags) {
                if ($missingTag -and $DefaultTags.ContainsKey($missingTag)) {
                    $currentTags[$missingTag] = $DefaultTags[$missingTag]
                }
            }
            
            # Update resource tags
            Update-AzTag -ResourceId $resourceId -Tag $currentTags -Operation Merge
            $updated++
            
            Write-Host "✓ Updated tags for: $($resource.name)" -ForegroundColor Green
            
        } catch {
            Write-Warning "✗ Failed to update tags for: $($resource.name) - $($_.Exception.Message)"
            $failed++
        }
    }
    
    return @{
        Updated = $updated
        Failed = $failed
    }
}

# Main execution
Write-Host "Scanning for untagged resources..." -ForegroundColor Blue

$untaggedResources = Get-UntaggedResources -Subscriptions $SubscriptionIds -Tags $RequiredTags

if ($untaggedResources.Count -eq 0) {
    Write-Host "✓ All resources are properly tagged!" -ForegroundColor Green
    return
}

Write-Host "Found $($untaggedResources.Count) resources with missing tags" -ForegroundColor Yellow

# Default tag values for auto-tagging
$defaultTags = @{
    "CostCenter" = "Unknown"
    "Environment" = "Development"
    "Owner" = "IT-Team"
    "Project" = "Unassigned"
}

$confirmation = Read-Host "Apply default tags to untagged resources? (y/N)"
if ($confirmation -eq "y" -or $confirmation -eq "Y") {
    $results = Set-BulkResourceTags -Resources $untaggedResources -DefaultTags $defaultTags
    
    Write-Host "`nTagging Results:" -ForegroundColor Blue
    Write-Host "✓ Successfully updated: $($results.Updated) resources" -ForegroundColor Green
    Write-Host "✗ Failed to update: $($results.Failed) resources" -ForegroundColor Red
} else {
    # Export untagged resources report
    $reportPath = "C:\temp\UntaggedResources-$(Get-Date -Format 'yyyy-MM-dd').csv"
    $untaggedResources | Export-Csv -Path $reportPath -NoTypeInformation
    Write-Host "Report exported to: $reportPath" -ForegroundColor Blue
}
```

## 5. Automated Rightsizing Recommendations

```powershell
#Requires -Module Az.Advisor, Az.Monitor

function Get-RightsizingRecommendations {
    param([string[]]$SubscriptionIds)
    
    $allRecommendations = @()
    
    foreach ($subscriptionId in $SubscriptionIds) {
        Set-AzContext -SubscriptionId $subscriptionId
        
        # Get Azure Advisor cost recommendations
        $recommendations = Get-AzAdvisorRecommendation -Category Cost
        
        foreach ($rec in $recommendations) {
            if ($rec.ShortDescription.Problem -like "*virtual machine*" -or 
                $rec.ShortDescription.Problem -like "*underutilized*") {
                
                $allRecommendations += [PSCustomObject]@{
                    SubscriptionId = $subscriptionId
                    ResourceName = $rec.ImpactedValue
                    ResourceType = $rec.ImpactedField
                    Problem = $rec.ShortDescription.Problem
                    Solution = $rec.ShortDescription.Solution
                    PotentialSavings = $rec.ExtendedProperties.savingsAmount
                    SavingsCurrency = $rec.ExtendedProperties.savingsCurrency
                    RecommendationId = $rec.Name
                    LastUpdated = $rec.LastUpdated
                }
            }
        }
    }
    
    return $allRecommendations
}

# Get and display rightsizing recommendations
$recommendations = Get-RightsizingRecommendations -SubscriptionIds $SubscriptionIds

if ($recommendations.Count -gt 0) {
    Write-Host "`nRightsizing Recommendations:" -ForegroundColor Blue
    $recommendations | Format-Table -AutoSize
    
    $totalSavings = ($recommendations | Measure-Object -Property PotentialSavings -Sum).Sum
    Write-Host "Total Potential Annual Savings: $$$totalSavings" -ForegroundColor Green
} else {
    Write-Host "No rightsizing recommendations found." -ForegroundColor Green
}
```

## Best Practices for PowerShell Cost Automation

### 1. Security and Authentication
- Use managed identities for Azure Automation
- Store sensitive data in Azure Key Vault
- Implement proper error handling and logging

### 2. Performance Optimization
- Use Azure Resource Graph for large-scale queries
- Implement parallel processing for multiple subscriptions
- Cache frequently accessed data

### 3. Monitoring and Alerting
- Set up comprehensive logging
- Create dashboards for script execution monitoring
- Implement retry logic for transient failures

### 4. Scheduling and Automation
```powershell
# Example Azure Automation runbook schedule
$scheduleParams = @{
    AutomationAccountName = "CostManagementAutomation"
    ResourceGroupName = "automation-rg"
    Name = "DailyCostMonitoring"
    StartTime = (Get-Date "06:00:00").AddDays(1)
    DayInterval = 1
}

New-AzAutomationSchedule @scheduleParams
```

## Conclusion

PowerShell provides unmatched flexibility for Azure cost management automation. These scripts form the foundation of a comprehensive cost control system that can:

- Monitor costs in real-time
- Identify optimization opportunities automatically
- Enforce governance through tagging
- Provide actionable recommendations
- Generate detailed reports

Start with the basic monitoring script and gradually implement more advanced features as your cost management requirements grow.

**Related Posts:**
- [Automating Azure Cost Optimization](/blog/automating-azure-cost-optimization)
- [Azure Cost Allocation and Chargeback](/blog/azure-cost-allocation-chargeback)
- [Enterprise Azure Cost Governance](/blog/enterprise-azure-cost-governance)
