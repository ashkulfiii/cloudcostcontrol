---
title: "Automating Azure Cost Optimization with Scripts and Tools"
description: "Master Azure cost optimization automation with PowerShell scripts, CLI tools, and third-party solutions that continuously optimize your cloud spending without manual intervention."
pubDate: 2025-12-01
tags: ["azure", "automation", "cost-optimization", "powershell", "scripts"]
author: "C³ - Cloud Cost Control"
---

# Automating Azure Cost Optimization with Scripts and Tools

Manual cost optimization doesn't scale. To truly control Azure costs in dynamic environments, you need automation that continuously identifies and eliminates waste. This comprehensive guide provides battle-tested scripts, tools, and strategies for automated cost optimization that can save 30-60% of your Azure spending.

## The Automation Imperative

### Why Manual Cost Optimization Fails

**The Scale Problem:**
- Enterprise environments: 10,000+ resources
- Daily resource changes: 100+ modifications
- Manual review time: 40+ hours per week
- Human error rate: 15-25% of optimizations missed

**The Speed Problem:**
- Manual VM right-sizing: 2-4 hours per resource
- Automated right-sizing: 2-4 minutes per resource
- Manual storage optimization: 1-2 days per account
- Automated optimization: 10-30 minutes per account

### ROI of Cost Optimization Automation

**Typical Investment:**
- Development time: 40-120 hours
- Tool licensing: $1,000-10,000/year
- Maintenance: 4-8 hours/month

**Typical Returns:**
- Cost savings: $50,000-500,000/year
- Time savings: 20-40 hours/week
- Error reduction: 80-95%
- Payback period: 1-3 months

## PowerShell Automation Scripts

### 1. Automated VM Right-Sizing Script

```powershell
<#
.SYNOPSIS
Automatically right-size Azure VMs based on utilization metrics

.DESCRIPTION
Analyzes VM CPU and memory utilization over 30 days and recommends
optimal VM sizes. Can automatically resize VMs with approval workflow.

.PARAMETER SubscriptionId
Azure subscription ID to analyze

.PARAMETER AutoResize
Switch to automatically resize VMs (use with caution)

.PARAMETER UtilizationThreshold
CPU utilization threshold below which VMs are considered oversized (default: 25%)
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoResize,
    
    [Parameter(Mandatory=$false)]
    [int]$UtilizationThreshold = 25
)

# Connect to Azure
Connect-AzAccount
Set-AzContext -SubscriptionId $SubscriptionId

function Get-VMUtilizationData {
    param(
        [string]$ResourceGroupName,
        [string]$VMName,
        [int]$Days = 30
    )
    
    $endTime = Get-Date
    $startTime = $endTime.AddDays(-$Days)
    
    # Get CPU utilization
    $cpuMetrics = Get-AzMetric -ResourceId "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.Compute/virtualMachines/$VMName" `
        -MetricName "Percentage CPU" `
        -StartTime $startTime `
        -EndTime $endTime `
        -TimeGrain "01:00:00"
    
    # Get memory utilization (requires Azure Monitor agent)
    $memoryMetrics = Get-AzMetric -ResourceId "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.Compute/virtualMachines/$VMName" `
        -MetricName "Available Memory Bytes" `
        -StartTime $startTime `
        -EndTime $endTime `
        -TimeGrain "01:00:00"
    
    $avgCpuUtilization = ($cpuMetrics.Data | Measure-Object -Property Average -Average).Average
    $maxCpuUtilization = ($cpuMetrics.Data | Measure-Object -Property Maximum -Maximum).Maximum
    
    return @{
        AverageCPU = [math]::Round($avgCpuUtilization, 2)
        MaximumCPU = [math]::Round($maxCpuUtilization, 2)
        VM = $VMName
        ResourceGroup = $ResourceGroupName
    }
}

function Get-RecommendedVMSize {
    param(
        [string]$CurrentSize,
        [double]$AvgCpuUtilization,
        [double]$MaxCpuUtilization
    )
    
    # VM size mapping for cost optimization
    $vmSizeMap = @{
        "Standard_D4s_v3" = @("Standard_D2s_v3", "Standard_B2s", "Standard_B2ms")
        "Standard_D8s_v3" = @("Standard_D4s_v3", "Standard_D2s_v3", "Standard_B4ms")
        "Standard_D16s_v3" = @("Standard_D8s_v3", "Standard_D4s_v3")
        "Standard_F4s_v2" = @("Standard_F2s_v2", "Standard_B2s")
        "Standard_F8s_v2" = @("Standard_F4s_v2", "Standard_F2s_v2")
    }
    
    # Determine if downsizing is appropriate
    if ($AvgCpuUtilization -lt 15 -and $MaxCpuUtilization -lt 50) {
        # Significant downsizing opportunity
        $recommendedSizes = $vmSizeMap[$CurrentSize]
        if ($recommendedSizes) {
            return $recommendedSizes[1]  # Second smallest option
        }
    }
    elseif ($AvgCpuUtilization -lt 25 -and $MaxCpuUtilization -lt 70) {
        # Moderate downsizing opportunity
        $recommendedSizes = $vmSizeMap[$CurrentSize]
        if ($recommendedSizes) {
            return $recommendedSizes[0]  # One size down
        }
    }
    
    return $CurrentSize  # No change recommended
}

function Calculate-CostSavings {
    param(
        [string]$CurrentSize,
        [string]$RecommendedSize,
        [string]$Region = "East US"
    )
    
    # Simplified pricing (update with current Azure pricing)
    $pricing = @{
        "Standard_D2s_v3" = 96.36
        "Standard_D4s_v3" = 192.72
        "Standard_D8s_v3" = 385.44
        "Standard_D16s_v3" = 770.88
        "Standard_F2s_v2" = 83.22
        "Standard_F4s_v2" = 166.44
        "Standard_F8s_v2" = 332.88
        "Standard_B2s" = 36.79
        "Standard_B2ms" = 61.32
        "Standard_B4ms" = 122.63
    }
    
    $currentCost = $pricing[$CurrentSize]
    $newCost = $pricing[$RecommendedSize]
    
    if ($currentCost -and $newCost) {
        $monthlySavings = $currentCost - $newCost
        return [math]::Round($monthlySavings, 2)
    }
    
    return 0
}

# Main execution
Write-Host "Starting VM right-sizing analysis..." -ForegroundColor Green

$allVMs = Get-AzVM
$rightsizingRecommendations = @()
$totalPotentialSavings = 0

foreach ($vm in $allVMs) {
    Write-Host "Analyzing VM: $($vm.Name)" -ForegroundColor Yellow
    
    try {
        $utilization = Get-VMUtilizationData -ResourceGroupName $vm.ResourceGroupName -VMName $vm.Name
        $recommendedSize = Get-RecommendedVMSize -CurrentSize $vm.HardwareProfile.VmSize -AvgCpuUtilization $utilization.AverageCPU -MaxCpuUtilization $utilization.MaximumCPU
        
        if ($recommendedSize -ne $vm.HardwareProfile.VmSize) {
            $savings = Calculate-CostSavings -CurrentSize $vm.HardwareProfile.VmSize -RecommendedSize $recommendedSize
            
            $recommendation = [PSCustomObject]@{
                VMName = $vm.Name
                ResourceGroup = $vm.ResourceGroupName
                CurrentSize = $vm.HardwareProfile.VmSize
                RecommendedSize = $recommendedSize
                AverageCPU = $utilization.AverageCPU
                MaximumCPU = $utilization.MaximumCPU
                MonthlySavings = $savings
                Status = "Pending"
            }
            
            $rightsizingRecommendations += $recommendation
            $totalPotentialSavings += $savings
            
            Write-Host "  Recommendation: $($vm.HardwareProfile.VmSize) -> $recommendedSize (Save: $$$savings/month)" -ForegroundColor Cyan
            
            # Auto-resize if enabled and savings are significant
            if ($AutoResize -and $savings -gt 50) {
                Write-Host "  Auto-resizing VM..." -ForegroundColor Green
                
                # Stop VM
                Stop-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -Force
                
                # Update VM size
                $vm.HardwareProfile.VmSize = $recommendedSize
                Update-AzVM -ResourceGroupName $vm.ResourceGroupName -VM $vm
                
                # Start VM
                Start-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name
                
                $recommendation.Status = "Completed"
                Write-Host "  VM resized successfully!" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Warning "Failed to analyze VM $($vm.Name): $($_.Exception.Message)"
    }
}

# Generate report
Write-Host "`nRight-sizing Analysis Complete!" -ForegroundColor Green
Write-Host "Total VMs analyzed: $($allVMs.Count)" -ForegroundColor White
Write-Host "VMs with recommendations: $($rightsizingRecommendations.Count)" -ForegroundColor White
Write-Host "Total potential monthly savings: $$$totalPotentialSavings" -ForegroundColor Yellow

# Export detailed report
$rightsizingRecommendations | Export-Csv -Path "VM-Rightsizing-Report-$(Get-Date -Format 'yyyy-MM-dd').csv" -NoTypeInformation
Write-Host "Detailed report saved to: VM-Rightsizing-Report-$(Get-Date -Format 'yyyy-MM-dd').csv" -ForegroundColor Green
```

### 2. Automated Orphaned Resource Cleanup

```powershell
<#
.SYNOPSIS
Identifies and optionally removes orphaned Azure resources

.DESCRIPTION
Scans for unused resources like unattached disks, unused public IPs,
empty resource groups, and unused load balancers that continue to incur costs.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoCleanup,
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30
)

Connect-AzAccount
Set-AzContext -SubscriptionId $SubscriptionId

function Find-OrphanedDisks {
    Write-Host "Scanning for orphaned managed disks..." -ForegroundColor Yellow
    
    $orphanedDisks = Get-AzDisk | Where-Object {
        $_.DiskState -eq "Unattached" -and 
        $_.TimeCreated -lt (Get-Date).AddDays(-$RetentionDays)
    }
    
    $totalCost = 0
    foreach ($disk in $orphanedDisks) {
        # Estimate monthly cost based on disk size and type
        $monthlyCost = switch ($disk.Sku.Name) {
            "Premium_LRS" { $disk.DiskSizeGB * 0.135 }
            "StandardSSD_LRS" { $disk.DiskSizeGB * 0.075 }
            "Standard_LRS" { $disk.DiskSizeGB * 0.045 }
            default { $disk.DiskSizeGB * 0.075 }
        }
        
        $totalCost += $monthlyCost
        
        Write-Host "  Orphaned Disk: $($disk.Name) - Size: $($disk.DiskSizeGB)GB - Cost: $$$([math]::Round($monthlyCost, 2))/month" -ForegroundColor Red
        
        if ($AutoCleanup) {
            Write-Host "    Removing disk..." -ForegroundColor Green
            Remove-AzDisk -ResourceGroupName $disk.ResourceGroupName -DiskName $disk.Name -Force
        }
    }
    
    return @{
        Count = $orphanedDisks.Count
        MonthlyCost = [math]::Round($totalCost, 2)
        Resources = $orphanedDisks
    }
}

function Find-UnusedPublicIPs {
    Write-Host "Scanning for unused public IP addresses..." -ForegroundColor Yellow
    
    $unusedIPs = Get-AzPublicIpAddress | Where-Object {
        $_.IpConfiguration -eq $null -and
        $_.IpTags.Count -eq 0
    }
    
    $monthlyCostPerIP = 3.65  # Standard public IP cost
    $totalCost = $unusedIPs.Count * $monthlyCostPerIP
    
    foreach ($ip in $unusedIPs) {
        Write-Host "  Unused Public IP: $($ip.Name) - Cost: $$$monthlyCostPerIP/month" -ForegroundColor Red
        
        if ($AutoCleanup) {
            Write-Host "    Removing public IP..." -ForegroundColor Green
            Remove-AzPublicIpAddress -ResourceGroupName $ip.ResourceGroupName -Name $ip.Name -Force
        }
    }
    
    return @{
        Count = $unusedIPs.Count
        MonthlyCost = [math]::Round($totalCost, 2)
        Resources = $unusedIPs
    }
}

function Find-UnusedLoadBalancers {
    Write-Host "Scanning for unused load balancers..." -ForegroundColor Yellow
    
    $unusedLBs = Get-AzLoadBalancer | Where-Object {
        $_.BackendAddressPools.BackendIpConfigurations.Count -eq 0
    }
    
    $monthlyCostPerLB = 18.25  # Basic load balancer cost
    $totalCost = $unusedLBs.Count * $monthlyCostPerLB
    
    foreach ($lb in $unusedLBs) {
        Write-Host "  Unused Load Balancer: $($lb.Name) - Cost: $$$monthlyCostPerLB/month" -ForegroundColor Red
        
        if ($AutoCleanup) {
            Write-Host "    Removing load balancer..." -ForegroundColor Green
            Remove-AzLoadBalancer -ResourceGroupName $lb.ResourceGroupName -Name $lb.Name -Force
        }
    }
    
    return @{
        Count = $unusedLBs.Count
        MonthlyCost = [math]::Round($totalCost, 2)
        Resources = $unusedLBs
    }
}

function Find-EmptyResourceGroups {
    Write-Host "Scanning for empty resource groups..." -ForegroundColor Yellow
    
    $emptyResourceGroups = Get-AzResourceGroup | Where-Object {
        (Get-AzResource -ResourceGroupName $_.ResourceGroupName).Count -eq 0
    }
    
    foreach ($rg in $emptyResourceGroups) {
        Write-Host "  Empty Resource Group: $($rg.ResourceGroupName)" -ForegroundColor Red
        
        if ($AutoCleanup) {
            Write-Host "    Removing resource group..." -ForegroundColor Green
            Remove-AzResourceGroup -Name $rg.ResourceGroupName -Force
        }
    }
    
    return @{
        Count = $emptyResourceGroups.Count
        Resources = $emptyResourceGroups
    }
}

# Execute cleanup functions
Write-Host "Starting orphaned resource cleanup analysis..." -ForegroundColor Green
Write-Host "Subscription: $SubscriptionId" -ForegroundColor White
Write-Host "Retention period: $RetentionDays days" -ForegroundColor White
Write-Host "Auto-cleanup: $AutoCleanup" -ForegroundColor White
Write-Host ""

$orphanedDisks = Find-OrphanedDisks
$unusedIPs = Find-UnusedPublicIPs
$unusedLBs = Find-UnusedLoadBalancers
$emptyRGs = Find-EmptyResourceGroups

# Summary report
Write-Host "`nCleanup Analysis Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor White
Write-Host "Orphaned Disks: $($orphanedDisks.Count) items - $$$($orphanedDisks.MonthlyCost)/month" -ForegroundColor Yellow
Write-Host "Unused Public IPs: $($unusedIPs.Count) items - $$$($unusedIPs.MonthlyCost)/month" -ForegroundColor Yellow
Write-Host "Unused Load Balancers: $($unusedLBs.Count) items - $$$($unusedLBs.MonthlyCost)/month" -ForegroundColor Yellow
Write-Host "Empty Resource Groups: $($emptyRGs.Count) items" -ForegroundColor Yellow

$totalMonthlySavings = $orphanedDisks.MonthlyCost + $unusedIPs.MonthlyCost + $unusedLBs.MonthlyCost
Write-Host "Total Potential Monthly Savings: $$$totalMonthlySavings" -ForegroundColor Green

# Create detailed report
$report = @{
    AnalysisDate = Get-Date
    SubscriptionId = $SubscriptionId
    OrphanedDisks = $orphanedDisks
    UnusedPublicIPs = $unusedIPs
    UnusedLoadBalancers = $unusedLBs
    EmptyResourceGroups = $emptyRGs
    TotalMonthlySavings = $totalMonthlySavings
}

$report | ConvertTo-Json -Depth 5 | Out-File "Orphaned-Resources-Report-$(Get-Date -Format 'yyyy-MM-dd').json"
Write-Host "Detailed report saved to: Orphaned-Resources-Report-$(Get-Date -Format 'yyyy-MM-dd').json" -ForegroundColor Green
```

### 3. Automated Storage Optimization

```powershell
<#
.SYNOPSIS
Optimizes Azure Storage accounts by implementing lifecycle policies and tier optimization

.DESCRIPTION
Analyzes blob storage usage patterns and automatically implements cost-saving
lifecycle management policies and storage tier optimizations.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [switch]$ImplementPolicies,
    
    [Parameter(Mandatory=$false)]
    [int]$CoolTierDays = 30,
    
    [Parameter(Mandatory=$false)]
    [int]$ArchiveTierDays = 90
)

Connect-AzAccount
Set-AzContext -SubscriptionId $SubscriptionId

function Analyze-StorageAccount {
    param(
        [string]$StorageAccountName,
        [string]$ResourceGroupName
    )
    
    Write-Host "Analyzing storage account: $StorageAccountName" -ForegroundColor Yellow
    
    # Get storage account context
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName
    $ctx = $storageAccount.Context
    
    # Analyze blob containers
    $containers = Get-AzStorageContainer -Context $ctx
    $totalSavings = 0
    $recommendations = @()
    
    foreach ($container in $containers) {
        Write-Host "  Analyzing container: $($container.Name)" -ForegroundColor Cyan
        
        # Get blobs and analyze access patterns
        $blobs = Get-AzStorageBlob -Container $container.Name -Context $ctx
        $hotBlobs = @()
        $coolCandidates = @()
        $archiveCandidates = @()
        
        foreach ($blob in $blobs) {
            $daysSinceModified = (Get-Date) - $blob.LastModified.DateTime
            $daysSinceAccessed = (Get-Date) - $blob.AccessTier  # Simplified for example
            
            if ($daysSinceModified.Days -gt $ArchiveTierDays -and $blob.AccessTier -eq "Hot") {
                $archiveCandidates += $blob
            }
            elseif ($daysSinceModified.Days -gt $CoolTierDays -and $blob.AccessTier -eq "Hot") {
                $coolCandidates += $blob
            }
            else {
                $hotBlobs += $blob
            }
        }
        
        # Calculate potential savings
        $coolSavings = ($coolCandidates | Measure-Object -Property Length -Sum).Sum * 0.01 / 1GB * 0.5  # Simplified calculation
        $archiveSavings = ($archiveCandidates | Measure-Object -Property Length -Sum).Sum * 0.01 / 1GB * 0.8
        $containerSavings = $coolSavings + $archiveSavings
        $totalSavings += $containerSavings
        
        $containerRecommendation = [PSCustomObject]@{
            StorageAccount = $StorageAccountName
            Container = $container.Name
            TotalBlobs = $blobs.Count
            HotBlobs = $hotBlobs.Count
            CoolCandidates = $coolCandidates.Count
            ArchiveCandidates = $archiveCandidates.Count
            EstimatedMonthlySavings = [math]::Round($containerSavings, 2)
        }
        
        $recommendations += $containerRecommendation
        
        Write-Host "    Hot blobs: $($hotBlobs.Count)" -ForegroundColor Green
        Write-Host "    Cool candidates: $($coolCandidates.Count)" -ForegroundColor Yellow
        Write-Host "    Archive candidates: $($archiveCandidates.Count)" -ForegroundColor Red
        Write-Host "    Potential monthly savings: $$$([math]::Round($containerSavings, 2))" -ForegroundColor Cyan
    }
    
    return @{
        StorageAccount = $StorageAccountName
        Recommendations = $recommendations
        TotalMonthlySavings = [math]::Round($totalSavings, 2)
    }
}

function Create-LifecyclePolicy {
    param(
        [string]$StorageAccountName,
        [string]$ResourceGroupName,
        [int]$CoolTierDays,
        [int]$ArchiveTierDays
    )
    
    $rules = @()
    
    # Rule for general blob lifecycle management
    $rule1 = New-AzStorageAccountManagementPolicyRule -Name "GeneralBlobLifecycle" `
        -BlobType blockBlob `
        -DaysAfterModificationGreaterThan $CoolTierDays `
        -SetBlobTierToCool
    
    $rule2 = New-AzStorageAccountManagementPolicyRule -Name "GeneralBlobArchive" `
        -BlobType blockBlob `
        -DaysAfterModificationGreaterThan $ArchiveTierDays `
        -SetBlobTierToArchive
    
    # Rule for old snapshots and versions
    $rule3 = New-AzStorageAccountManagementPolicyRule -Name "SnapshotCleanup" `
        -BlobType blockBlob `
        -DaysAfterCreationGreaterThan 30 `
        -DeleteSnapshot
    
    $rules += $rule1, $rule2, $rule3
    
    # Create management policy
    $policy = Set-AzStorageAccountManagementPolicy -ResourceGroupName $ResourceGroupName `
        -StorageAccountName $StorageAccountName `
        -Rule $rules
    
    Write-Host "Lifecycle policy created for $StorageAccountName" -ForegroundColor Green
    return $policy
}

# Main execution
Write-Host "Starting Storage Optimization Analysis..." -ForegroundColor Green

$storageAccounts = Get-AzStorageAccount
$allRecommendations = @()
$totalPotentialSavings = 0

foreach ($storageAccount in $storageAccounts) {
    try {
        $analysis = Analyze-StorageAccount -StorageAccountName $storageAccount.StorageAccountName -ResourceGroupName $storageAccount.ResourceGroupName
        $allRecommendations += $analysis.Recommendations
        $totalPotentialSavings += $analysis.TotalMonthlySavings
        
        if ($ImplementPolicies -and $analysis.TotalMonthlySavings -gt 10) {
            Write-Host "Implementing lifecycle policy for $($storageAccount.StorageAccountName)..." -ForegroundColor Green
            Create-LifecyclePolicy -StorageAccountName $storageAccount.StorageAccountName `
                -ResourceGroupName $storageAccount.ResourceGroupName `
                -CoolTierDays $CoolTierDays `
                -ArchiveTierDays $ArchiveTierDays
        }
    }
    catch {
        Write-Warning "Failed to analyze storage account $($storageAccount.StorageAccountName): $($_.Exception.Message)"
    }
}

# Summary
Write-Host "`nStorage Optimization Analysis Complete!" -ForegroundColor Green
Write-Host "Storage accounts analyzed: $($storageAccounts.Count)" -ForegroundColor White
Write-Host "Total potential monthly savings: $$$totalPotentialSavings" -ForegroundColor Yellow

# Export recommendations
$allRecommendations | Export-Csv -Path "Storage-Optimization-Report-$(Get-Date -Format 'yyyy-MM-dd').csv" -NoTypeInformation
Write-Host "Detailed report saved to: Storage-Optimization-Report-$(Get-Date -Format 'yyyy-MM-dd').csv" -ForegroundColor Green
```

## Azure CLI Automation Examples

### 1. Automated Development Environment Shutdown

```bash
#!/bin/bash
# dev-environment-scheduler.sh
# Automatically shut down development VMs outside business hours

SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP_TAG="Environment"
ENVIRONMENT_VALUE="Development"

# Set timezone and business hours
TIMEZONE="America/New_York"
BUSINESS_START_HOUR=8
BUSINESS_END_HOUR=18

# Login to Azure (use service principal in production)
az login --service-principal -u $APP_ID -p $PASSWORD --tenant $TENANT_ID
az account set --subscription $SUBSCRIPTION_ID

# Function to check if current time is within business hours
is_business_hours() {
    current_hour=$(TZ=$TIMEZONE date +%H)
    current_day=$(TZ=$TIMEZONE date +%u)  # 1=Monday, 7=Sunday
    
    # Check if it's a weekday (Monday-Friday) and within business hours
    if [ $current_day -le 5 ] && [ $current_hour -ge $BUSINESS_START_HOUR ] && [ $current_hour -lt $BUSINESS_END_HOUR ]; then
        return 0  # Business hours
    else
        return 1  # Outside business hours
    fi
}

# Get all development VMs
echo "Scanning for development VMs..."
dev_vms=$(az vm list --query "[?tags.$RESOURCE_GROUP_TAG=='$ENVIRONMENT_VALUE'].{name:name, resourceGroup:resourceGroup, powerState:instanceView.statuses[1].displayStatus}" -o tsv)

if is_business_hours; then
    echo "Business hours detected. Starting stopped development VMs..."
    
    while IFS=$'\t' read -r vm_name resource_group power_state; do
        if [[ "$power_state" == "VM deallocated" ]]; then
            echo "Starting VM: $vm_name"
            az vm start --name "$vm_name" --resource-group "$resource_group" --no-wait
        fi
    done <<< "$dev_vms"
else
    echo "Outside business hours. Stopping running development VMs..."
    
    while IFS=$'\t' read -r vm_name resource_group power_state; do
        if [[ "$power_state" == "VM running" ]]; then
            echo "Stopping VM: $vm_name"
            az vm deallocate --name "$vm_name" --resource-group "$resource_group" --no-wait
        fi
    done <<< "$dev_vms"
fi

# Calculate potential savings
running_vms=$(echo "$dev_vms" | grep "VM running" | wc -l)
deallocated_vms=$(echo "$dev_vms" | grep "VM deallocated" | wc -l)

echo "Development VM Status:"
echo "  Running: $running_vms"
echo "  Deallocated: $deallocated_vms"

if ! is_business_hours; then
    # Estimate daily savings (assuming $2/hour average VM cost)
    daily_savings=$((deallocated_vms * 16 * 2))  # 16 non-business hours
    echo "  Estimated daily savings: \$$daily_savings"
fi
```

### 2. Automated Reserved Instance Recommendations

```bash
#!/bin/bash
# ri-recommendation-automation.sh
# Analyze VM usage and generate Reserved Instance purchase recommendations

SUBSCRIPTION_ID="your-subscription-id"
DAYS_TO_ANALYZE=30
MIN_UTILIZATION_HOURS=600  # 20 hours/day * 30 days

echo "Analyzing Reserved Instance opportunities..."

# Get all running VMs with their runtime
az vm list --show-details --query '[].{name:name, resourceGroup:resourceGroup, size:hardwareProfile.vmSize, location:location, powerState:powerState}' -o json > current_vms.json

# Analyze each VM size and location combination
python3 << 'EOF'
import json
import sys
from collections import defaultdict

# Load VM data
with open('current_vms.json', 'r') as f:
    vms = json.load(f)

# Group VMs by size and location
vm_groups = defaultdict(list)
for vm in vms:
    if vm['powerState'] == 'VM running':
        key = f"{vm['size']}_{vm['location']}"
        vm_groups[key].append(vm)

# Calculate RI recommendations
recommendations = []
for group_key, group_vms in vm_groups.items():
    size, location = group_key.split('_', 1)
    vm_count = len(group_vms)
    
    # Simple logic: recommend RI if we have 2+ VMs of same size in same location
    if vm_count >= 2:
        # Pricing estimates (update with current Azure pricing)
        pricing_map = {
            'Standard_D2s_v3': {'payg': 96.36, 'ri_1yr': 57.82, 'ri_3yr': 38.54},
            'Standard_D4s_v3': {'payg': 192.72, 'ri_1yr': 115.63, 'ri_3yr': 77.09},
            'Standard_D8s_v3': {'payg': 385.44, 'ri_1yr': 231.26, 'ri_3yr': 154.18}
        }
        
        if size in pricing_map:
            payg_cost = pricing_map[size]['payg'] * vm_count
            ri_1yr_cost = pricing_map[size]['ri_1yr'] * vm_count
            ri_3yr_cost = pricing_map[size]['ri_3yr'] * vm_count
            
            monthly_savings_1yr = payg_cost - ri_1yr_cost
            monthly_savings_3yr = payg_cost - ri_3yr_cost
            
            recommendations.append({
                'vm_size': size,
                'location': location,
                'vm_count': vm_count,
                'current_monthly_cost': round(payg_cost, 2),
                'ri_1yr_monthly_cost': round(ri_1yr_cost, 2),
                'ri_3yr_monthly_cost': round(ri_3yr_cost, 2),
                'monthly_savings_1yr': round(monthly_savings_1yr, 2),
                'monthly_savings_3yr': round(monthly_savings_3yr, 2),
                'annual_savings_1yr': round(monthly_savings_1yr * 12, 2),
                'annual_savings_3yr': round(monthly_savings_3yr * 12, 2)
            })

# Output recommendations
print("Reserved Instance Recommendations:")
print("=" * 80)
total_annual_savings_1yr = 0
total_annual_savings_3yr = 0

for rec in recommendations:
    print(f"VM Size: {rec['vm_size']} | Location: {rec['location']} | Count: {rec['vm_count']}")
    print(f"  Current monthly cost: ${rec['current_monthly_cost']}")
    print(f"  1-year RI cost: ${rec['ri_1yr_monthly_cost']} (Save: ${rec['monthly_savings_1yr']}/month)")
    print(f"  3-year RI cost: ${rec['ri_3yr_monthly_cost']} (Save: ${rec['monthly_savings_3yr']}/month)")
    print(f"  Annual savings: 1yr=${rec['annual_savings_1yr']} | 3yr=${rec['annual_savings_3yr']}")
    print("-" * 80)
    
    total_annual_savings_1yr += rec['annual_savings_1yr']
    total_annual_savings_3yr += rec['annual_savings_3yr']

print(f"Total potential annual savings:")
print(f"  1-year RIs: ${total_annual_savings_1yr}")
print(f"  3-year RIs: ${total_annual_savings_3yr}")

# Save recommendations to file
with open(f'ri-recommendations-{datetime.now().strftime("%Y-%m-%d")}.json', 'w') as f:
    json.dump(recommendations, f, indent=2)

EOF

# Cleanup temporary files
rm current_vms.json
```

## Third-Party Tools Integration

### 1. Azure Cost Management API Integration

```python
# azure_cost_automation.py
# Automated cost analysis and alerting using Azure Cost Management APIs

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class AzureCostAutomation:
    def __init__(self, subscription_id, client_id, client_secret, tenant_id):
        self.subscription_id = subscription_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        """Authenticate with Azure and get access token"""
        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'resource': 'https://management.azure.com/'
        }
        
        response = requests.post(url, data=data)
        return response.json()['access_token']
    
    def get_cost_data(self, start_date, end_date, granularity='Daily'):
        """Retrieve cost data from Azure Cost Management API"""
        url = f"https://management.azure.com/subscriptions/{self.subscription_id}/providers/Microsoft.CostManagement/query"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        body = {
            "type": "ActualCost",
            "timeframe": "Custom",
            "timePeriod": {
                "from": start_date,
                "to": end_date
            },
            "dataset": {
                "granularity": granularity,
                "aggregation": {
                    "totalCost": {
                        "name": "PreTaxCost",
                        "function": "Sum"
                    }
                },
                "grouping": [
                    {
                        "type": "Dimension",
                        "name": "ResourceGroupName"
                    },
                    {
                        "type": "Dimension", 
                        "name": "ServiceName"
                    }
                ]
            }
        }
        
        response = requests.post(url, headers=headers, json=body)
        return response.json()
    
    def analyze_cost_anomalies(self, threshold_percentage=20):
        """Detect cost anomalies by comparing with previous period"""
        # Get current month data
        current_month_start = datetime.now().replace(day=1)
        current_month_end = datetime.now()
        
        # Get previous month data
        previous_month_end = current_month_start - timedelta(days=1)
        previous_month_start = previous_month_end.replace(day=1)
        
        current_costs = self.get_cost_data(
            current_month_start.strftime('%Y-%m-%d'),
            current_month_end.strftime('%Y-%m-%d')
        )
        
        previous_costs = self.get_cost_data(
            previous_month_start.strftime('%Y-%m-%d'),
            previous_month_end.strftime('%Y-%m-%d')
        )
        
        # Process and compare costs
        anomalies = []
        current_total = sum(row[2] for row in current_costs['properties']['rows'])
        previous_total = sum(row[2] for row in previous_costs['properties']['rows'])
        
        if previous_total > 0:
            percentage_change = ((current_total - previous_total) / previous_total) * 100
            
            if abs(percentage_change) > threshold_percentage:
                anomalies.append({
                    'type': 'Total Cost Anomaly',
                    'current_cost': current_total,
                    'previous_cost': previous_total,
                    'percentage_change': percentage_change,
                    'threshold': threshold_percentage
                })
        
        return anomalies
    
    def generate_optimization_report(self):
        """Generate automated optimization recommendations"""
        # Get last 30 days of cost data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        cost_data = self.get_cost_data(
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d')
        )
        
        # Analyze by resource group and service
        df = pd.DataFrame(cost_data['properties']['rows'], 
                         columns=['Date', 'ResourceGroup', 'Service', 'Cost'])
        
        # Top spending analysis
        top_resource_groups = df.groupby('ResourceGroup')['Cost'].sum().sort_values(ascending=False).head(10)
        top_services = df.groupby('Service')['Cost'].sum().sort_values(ascending=False).head(10)
        
        # Generate recommendations
        recommendations = []
        
        # High-cost resource groups with potential for optimization
        for rg, cost in top_resource_groups.items():
            if cost > 1000:  # $1000+ per month threshold
                recommendations.append({
                    'type': 'High Cost Resource Group',
                    'resource_group': rg,
                    'monthly_cost': cost,
                    'recommendation': 'Review for right-sizing and unused resources'
                })
        
        return {
            'top_resource_groups': top_resource_groups.to_dict(),
            'top_services': top_services.to_dict(),
            'recommendations': recommendations
        }
    
    def send_cost_alert(self, anomalies, smtp_server, smtp_port, email_user, email_password, recipients):
        """Send email alerts for cost anomalies"""
        if not anomalies:
            return
        
        msg = MIMEMultipart()
        msg['From'] = email_user
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = f"Azure Cost Anomaly Alert - {datetime.now().strftime('%Y-%m-%d')}"
        
        body = "Azure Cost Anomalies Detected:\n\n"
        for anomaly in anomalies:
            body += f"Type: {anomaly['type']}\n"
            body += f"Current Cost: ${anomaly['current_cost']:.2f}\n"
            body += f"Previous Cost: ${anomaly['previous_cost']:.2f}\n"
            body += f"Change: {anomaly['percentage_change']:.1f}%\n"
            body += f"Threshold: {anomaly['threshold']}%\n\n"
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_user, email_password)
        text = msg.as_string()
        server.sendmail(email_user, recipients, text)
        server.quit()

# Usage example
if __name__ == "__main__":
    # Initialize cost automation
    cost_automation = AzureCostAutomation(
        subscription_id="your-subscription-id",
        client_id="your-client-id",
        client_secret="your-client-secret",
        tenant_id="your-tenant-id"
    )
    
    # Check for cost anomalies
    anomalies = cost_automation.analyze_cost_anomalies(threshold_percentage=15)
    
    # Generate optimization report
    optimization_report = cost_automation.generate_optimization_report()
    
    # Send alerts if anomalies detected
    if anomalies:
        cost_automation.send_cost_alert(
            anomalies=anomalies,
            smtp_server="smtp.gmail.com",
            smtp_port=587,
            email_user="your-email@gmail.com",
            email_password="your-password",
            recipients=["admin@company.com", "finops@company.com"]
        )
    
    print("Cost automation completed successfully!")
```

## Automation Deployment Strategies

### 1. Azure Automation Account Setup

```powershell
# Create Azure Automation Account for cost optimization
$resourceGroupName = "CostOptimization-RG"
$automationAccountName = "CostOptimization-Automation"
$location = "East US"

# Create resource group
New-AzResourceGroup -Name $resourceGroupName -Location $location

# Create automation account
New-AzAutomationAccount -ResourceGroupName $resourceGroupName -Name $automationAccountName -Location $location

# Import required modules
$modules = @(
    "Az.Profile",
    "Az.Compute", 
    "Az.Storage",
    "Az.Monitor",
    "Az.Resources"
)

foreach ($module in $modules) {
    Import-AzAutomationModule -AutomationAccountName $automationAccountName -ResourceGroupName $resourceGroupName -Name $module
}

# Create runbook for VM right-sizing
$runbookName = "VMRightSizingRunbook"
$runbookContent = Get-Content "VM-RightSizing-Script.ps1" -Raw

New-AzAutomationRunbook -AutomationAccountName $automationAccountName -ResourceGroupName $resourceGroupName -Name $runbookName -Type PowerShell
Set-AzAutomationRunbookDefinition -AutomationAccountName $automationAccountName -ResourceGroupName $resourceGroupName -Name $runbookName -Path "VM-RightSizing-Script.ps1"

# Publish runbook
Publish-AzAutomationRunbook -AutomationAccountName $automationAccountName -ResourceGroupName $resourceGroupName -Name $runbookName

# Schedule runbook to run weekly
$scheduleName = "WeeklyVMOptimization"
$startTime = (Get-Date).AddHours(1)
New-AzAutomationSchedule -AutomationAccountName $automationAccountName -ResourceGroupName $resourceGroupName -Name $scheduleName -StartTime $startTime -WeekInterval 1

Register-AzAutomationScheduledRunbook -AutomationAccountName $automationAccountName -ResourceGroupName $resourceGroupName -RunbookName $runbookName -ScheduleName $scheduleName
```

### 2. Logic Apps for Cost Automation

```json
{
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {},
    "triggers": {
        "Recurrence": {
            "recurrence": {
                "frequency": "Day",
                "interval": 1,
                "schedule": {
                    "hours": ["6"]
                }
            },
            "type": "Recurrence"
        }
    },
    "actions": {
        "Get_Azure_Costs": {
            "type": "Http",
            "inputs": {
                "method": "POST",
                "uri": "https://management.azure.com/subscriptions/{subscription-id}/providers/Microsoft.CostManagement/query",
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer @{parameters('access_token')}"
                },
                "body": {
                    "type": "ActualCost",
                    "timeframe": "MonthToDate",
                    "dataset": {
                        "granularity": "Daily",
                        "aggregation": {
                            "totalCost": {
                                "name": "PreTaxCost",
                                "function": "Sum"
                            }
                        }
                    }
                }
            }
        },
        "Check_Budget_Threshold": {
            "type": "Condition",
            "expression": {
                "greater": [
                    "@body('Get_Azure_Costs')?['properties']?['rows']?[0]?[0]",
                    5000
                ]
            },
            "actions": {
                "Send_Budget_Alert": {
                    "type": "Http",
                    "inputs": {
                        "method": "POST",
                        "uri": "https://api.sendgrid.com/v3/mail/send",
                        "headers": {
                            "Authorization": "Bearer @{parameters('sendgrid_api_key')}",
                            "Content-Type": "application/json"
                        },
                        "body": {
                            "personalizations": [{
                                "to": [{"email": "admin@company.com"}]
                            }],
                            "from": {"email": "noreply@company.com"},
                            "subject": "Azure Budget Alert",
                            "content": [{
                                "type": "text/plain",
                                "value": "Monthly Azure spending has exceeded $5,000 threshold."
                            }]
                        }
                    }
                }
            }
        }
    }
}
```

## Conclusion

Automation is essential for scalable Azure cost optimization. The scripts and tools covered in this guide provide a foundation for building comprehensive cost optimization automation that can:

**Immediate Benefits:**
- **Reduce manual effort by 80-90%**
- **Increase optimization coverage to 95%+**
- **Eliminate human errors in cost management**
- **Enable real-time cost anomaly detection**

**Long-term Value:**
- **Continuous cost optimization without manual intervention**
- **Scalable solutions that grow with your Azure environment**
- **Data-driven insights for strategic cost decisions**
- **Cultural shift toward automated cost consciousness**

**Implementation Priority:**
1. **Start with VM right-sizing automation** (highest ROI)
2. **Implement orphaned resource cleanup** (quick wins)
3. **Deploy storage optimization** (long-term savings)
4. **Add cost anomaly detection** (proactive management)
5. **Build comprehensive automation workflows** (enterprise scale)

Remember: Start small, measure results, and gradually expand your automation coverage. The goal is to create a self-optimizing Azure environment that continuously reduces costs without compromising performance.

**Ready to automate your cost optimization?** Our automation specialists can help you implement these solutions and customize them for your specific environment. Contact us for a personalized automation roadmap.

**Next Steps:** Explore [Azure Hybrid Benefit optimization](/blog/azure-hybrid-benefit-guide) and learn about [enterprise cost governance](/blog/enterprise-azure-cost-governance) to complete your cost management strategy.
