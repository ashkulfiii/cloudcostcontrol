---
title: "Azure Virtual Machine Cost Optimization: Complete Performance Guide"
description: "Master Azure VM cost optimization with right-sizing strategies, scheduling automation, and performance monitoring to reduce compute costs by up to 60%."
pubDate: 2025-03-05
hero: "/blog-placeholder-2.jpg"
tags: ["azure", "virtual-machines", "cost-optimization", "compute", "performance"]
---

# Azure Virtual Machine Cost Optimization: Complete Performance Guide

Azure Virtual Machines often represent 40-60% of total cloud costs, making them a critical optimization target. This comprehensive guide shows you how to reduce Azure VM costs by up to 60% while maintaining or improving performance through intelligent sizing, scheduling, and monitoring strategies.

## Understanding Azure VM Cost Structure

### Primary Cost Components
- **Compute charges**: Based on VM size and running time
- **Storage costs**: OS and data disks (Premium vs Standard)
- **Network costs**: Bandwidth and load balancer usage
- **Backup and snapshot costs**: Data protection overhead
- **Software licensing**: Windows, SQL Server, third-party licenses

### Hidden Cost Drivers
- Over-provisioned VM sizes
- VMs running 24/7 for intermittent workloads
- Premium storage when Standard would suffice
- Unoptimized backup retention policies
- Idle VMs in forgotten resource groups

## VM Right-Sizing Strategies

### Automated VM Analysis Script

```powershell
# VM-RightSizing-Analyzer.ps1
param(
    [string]$SubscriptionId,
    [string]$ResourceGroupName = $null,
    [int]$AnalysisDays = 30
)

# Connect to Azure
Connect-AzAccount
Set-AzContext -SubscriptionId $SubscriptionId

# Get all VMs (or in specific resource group)
if ($ResourceGroupName) {
    $VMs = Get-AzVM -ResourceGroupName $ResourceGroupName
} else {
    $VMs = Get-AzVM
}

$recommendations = @()

foreach ($VM in $VMs) {
    Write-Host "Analyzing VM: $($VM.Name)" -ForegroundColor Green
    
    # Get VM metrics for the analysis period
    $endTime = Get-Date
    $startTime = $endTime.AddDays(-$AnalysisDays)
    
    # CPU utilization
    $cpuMetrics = Get-AzMetric -ResourceId $VM.Id -MetricName "Percentage CPU" -StartTime $startTime -EndTime $endTime -TimeGrain 01:00:00
    $avgCpuUtilization = ($cpuMetrics.Data | Measure-Object Average -Average).Average
    $maxCpuUtilization = ($cpuMetrics.Data | Measure-Object Maximum -Maximum).Maximum
    
    # Memory utilization (requires VM insights)
    $memoryMetrics = Get-AzMetric -ResourceId $VM.Id -MetricName "Available Memory Bytes" -StartTime $startTime -EndTime $endTime -TimeGrain 01:00:00 -ErrorAction SilentlyContinue
    
    # Network utilization
    $networkInMetrics = Get-AzMetric -ResourceId $VM.Id -MetricName "Network In Total" -StartTime $startTime -EndTime $endTime -TimeGrain 01:00:00
    $networkOutMetrics = Get-AzMetric -ResourceId $VM.Id -MetricName "Network Out Total" -StartTime $startTime -EndTime $endTime -TimeGrain 01:00:00
    
    # Get current VM size and pricing
    $vmSize = $VM.HardwareProfile.VmSize
    $location = $VM.Location
    
    # Get VM pricing information
    $pricingInfo = Get-AzVMPricing -Location $location -VmSize $vmSize
    $currentMonthlyCost = $pricingInfo.HourlyRate * 24 * 30
    
    # Analyze usage patterns
    $recommendation = Analyze-VMUsage -VM $VM -CpuUtilization $avgCpuUtilization -MaxCpuUtilization $maxCpuUtilization -CurrentCost $currentMonthlyCost
    
    $recommendations += $recommendation
}

# Function to analyze VM usage and recommend sizing
function Analyze-VMUsage {
    param($VM, $CpuUtilization, $MaxCpuUtilization, $CurrentCost)
    
    $vmSize = $VM.HardwareProfile.VmSize
    $currentSpecs = Get-VMSpecs -VmSize $vmSize
    
    $recommendation = [PSCustomObject]@{
        VMName = $VM.Name
        ResourceGroup = $VM.ResourceGroupName
        CurrentSize = $vmSize
        CurrentCores = $currentSpecs.Cores
        CurrentMemoryGB = $currentSpecs.MemoryGB
        CurrentMonthlyCost = $CurrentCost
        AvgCpuUtilization = [math]::Round($CpuUtilization, 2)
        MaxCpuUtilization = [math]::Round($MaxCpuUtilization, 2)
        RecommendedAction = ""
        RecommendedSize = ""
        PotentialSavings = 0
        RecommendationReason = ""
    }
    
    # Right-sizing logic
    if ($CpuUtilization -lt 5 -and $MaxCpuUtilization -lt 15) {
        $recommendation.RecommendedAction = "Downsize or Schedule"
        $recommendation.RecommendationReason = "Very low CPU utilization - consider smaller VM or scheduled start/stop"
        
        # Find smaller VM size
        $smallerSize = Find-SmallerVMSize -CurrentSize $vmSize -TargetCpuUtilization 20
        if ($smallerSize) {
            $smallerSpecs = Get-VMSpecs -VmSize $smallerSize.Name
            $smallerCost = $smallerSize.HourlyRate * 24 * 30
            $recommendation.RecommendedSize = $smallerSize.Name
            $recommendation.PotentialSavings = $CurrentCost - $smallerCost
        }
    }
    elseif ($CpuUtilization -lt 20 -and $MaxCpuUtilization -lt 40) {
        $recommendation.RecommendedAction = "Downsize"
        $recommendation.RecommendationReason = "Low CPU utilization - VM appears over-provisioned"
        
        # Find appropriately sized VM
        $rightSize = Find-RightSizedVM -CurrentSize $vmSize -TargetCpuUtilization 40
        if ($rightSize) {
            $rightSpecs = Get-VMSpecs -VmSize $rightSize.Name
            $rightCost = $rightSize.HourlyRate * 24 * 30
            $recommendation.RecommendedSize = $rightSize.Name
            $recommendation.PotentialSavings = $CurrentCost - $rightCost
        }
    }
    elseif ($CpuUtilization -gt 80 -or $MaxCpuUtilization -gt 90) {
        $recommendation.RecommendedAction = "Upsize"
        $recommendation.RecommendationReason = "High CPU utilization - VM may be under-provisioned"
        
        # Find larger VM size
        $largerSize = Find-LargerVMSize -CurrentSize $vmSize
        if ($largerSize) {
            $recommendation.RecommendedSize = $largerSize.Name
            $largerCost = $largerSize.HourlyRate * 24 * 30
            $recommendation.PotentialSavings = $largerCost - $CurrentCost  # Negative savings = additional cost
        }
    }
    else {
        $recommendation.RecommendedAction = "Optimize Further"
        $recommendation.RecommendationReason = "CPU utilization appears reasonable - check memory, storage, and scheduling"
    }
    
    return $recommendation
}

# Generate report
$recommendations | Sort-Object PotentialSavings -Descending | Format-Table -AutoSize
$totalPotentialSavings = ($recommendations | Measure-Object PotentialSavings -Sum).Sum

Write-Host "`nTotal Potential Monthly Savings: $${totalPotentialSavings:F2}" -ForegroundColor Yellow
Write-Host "Analysis based on $AnalysisDays days of metrics data" -ForegroundColor Cyan

# Export detailed recommendations
$recommendations | Export-Csv -Path "VM-Rightsizing-Recommendations-$(Get-Date -Format 'yyyyMMdd').csv" -NoTypeInformation
Write-Host "Detailed recommendations exported to CSV file" -ForegroundColor Green
```

### VM Specification Optimization

```json
{
  "vmSizingMatrix": {
    "workloadTypes": {
      "webServer": {
        "light": {
          "recommendedSizes": ["Standard_B1s", "Standard_B2s"],
          "cpuUtilizationTarget": "20-40%",
          "memoryUtilizationTarget": "30-50%"
        },
        "medium": {
          "recommendedSizes": ["Standard_B2ms", "Standard_D2s_v4"],
          "cpuUtilizationTarget": "40-60%",
          "memoryUtilizationTarget": "50-70%"
        },
        "heavy": {
          "recommendedSizes": ["Standard_D4s_v4", "Standard_D8s_v4"],
          "cpuUtilizationTarget": "60-80%",
          "memoryUtilizationTarget": "70-85%"
        }
      },
      "database": {
        "small": {
          "recommendedSizes": ["Standard_D2s_v4", "Standard_E2s_v4"],
          "cpuUtilizationTarget": "30-50%",
          "memoryUtilizationTarget": "60-80%"
        },
        "medium": {
          "recommendedSizes": ["Standard_E4s_v4", "Standard_E8s_v4"],
          "cpuUtilizationTarget": "50-70%",
          "memoryUtilizationTarget": "70-85%"
        },
        "large": {
          "recommendedSizes": ["Standard_E16s_v4", "Standard_E32s_v4"],
          "cpuUtilizationTarget": "60-80%",
          "memoryUtilizationTarget": "80-90%"
        }
      },
      "computeIntensive": {
        "standard": {
          "recommendedSizes": ["Standard_F4s_v2", "Standard_F8s_v2"],
          "cpuUtilizationTarget": "70-90%",
          "memoryUtilizationTarget": "40-60%"
        },
        "highPerformance": {
          "recommendedSizes": ["Standard_F16s_v2", "Standard_F32s_v2"],
          "cpuUtilizationTarget": "80-95%",
          "memoryUtilizationTarget": "50-70%"
        }
      }
    }
  }
}
```

## Automated VM Scheduling

### Smart Start/Stop Solution

```powershell
# Smart-VM-Scheduler.ps1
param(
    [string]$SubscriptionId,
    [string]$ResourceGroupName,
    [string]$ScheduleType = "BusinessHours"  # BusinessHours, Development, Custom
)

# Schedule definitions
$schedules = @{
    "BusinessHours" = @{
        "StartTime" = "08:00"
        "StopTime" = "18:00"
        "WeekdaysOnly" = $true
        "TimeZone" = "Eastern Standard Time"
    }
    "Development" = @{
        "StartTime" = "09:00"
        "StopTime" = "17:00"
        "WeekdaysOnly" = $true
        "TimeZone" = "Eastern Standard Time"
    }
    "AlwaysOn" = @{
        "Enabled" = $false
    }
}

function Set-VMScheduleTags {
    param($VM, $Schedule)
    
    $tags = @{
        "AutoStart" = $Schedule.StartTime
        "AutoStop" = $Schedule.StopTime
        "WeekdaysOnly" = $Schedule.WeekdaysOnly.ToString()
        "TimeZone" = $Schedule.TimeZone
        "ScheduleEnabled" = "True"
        "LastScheduleUpdate" = (Get-Date).ToString("yyyy-MM-dd")
    }
    
    # Merge with existing tags
    $existingTags = $VM.Tags
    if ($existingTags) {
        foreach ($key in $tags.Keys) {
            $existingTags[$key] = $tags[$key]
        }
        $allTags = $existingTags
    } else {
        $allTags = $tags
    }
    
    Set-AzResource -ResourceId $VM.Id -Tag $allTags -Force
    Write-Host "Updated schedule tags for VM: $($VM.Name)" -ForegroundColor Green
}

function Start-VMsBasedOnSchedule {
    param($ResourceGroupName)
    
    $currentTime = Get-Date
    $currentDay = $currentTime.DayOfWeek
    
    $vms = Get-AzVM -ResourceGroupName $ResourceGroupName
    
    foreach ($vm in $vms) {
        $scheduleEnabled = $vm.Tags["ScheduleEnabled"]
        if ($scheduleEnabled -eq "True") {
            $startTime = $vm.Tags["AutoStart"]
            $weekdaysOnly = [bool]::Parse($vm.Tags["WeekdaysOnly"])
            $timeZone = $vm.Tags["TimeZone"]
            
            # Skip weekends if weekdays only
            if ($weekdaysOnly -and ($currentDay -eq "Saturday" -or $currentDay -eq "Sunday")) {
                continue
            }
            
            # Convert schedule time to current timezone
            $scheduleTime = [DateTime]::ParseExact($startTime, "HH:mm", $null)
            $scheduleDateTime = Get-Date -Hour $scheduleTime.Hour -Minute $scheduleTime.Minute -Second 0
            
            # Check if it's time to start (within 15-minute window)
            $timeDifference = ($currentTime - $scheduleDateTime).TotalMinutes
            
            if ($timeDifference -ge 0 -and $timeDifference -le 15) {
                $vmStatus = Get-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -Status
                $powerState = $vmStatus.Statuses | Where-Object { $_.Code -like "PowerState/*" }
                
                if ($powerState.Code -eq "PowerState/deallocated") {
                    Write-Host "Starting VM: $($vm.Name)" -ForegroundColor Yellow
                    Start-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -AsJob
                    
                    # Log the action
                    Write-EventLog -LogName "Application" -Source "VM Scheduler" -EventId 1001 -Message "Started VM: $($vm.Name)"
                }
            }
        }
    }
}

function Stop-VMsBasedOnSchedule {
    param($ResourceGroupName)
    
    $currentTime = Get-Date
    $currentDay = $currentTime.DayOfWeek
    
    $vms = Get-AzVM -ResourceGroupName $ResourceGroupName
    
    foreach ($vm in $vms) {
        $scheduleEnabled = $vm.Tags["ScheduleEnabled"]
        if ($scheduleEnabled -eq "True") {
            $stopTime = $vm.Tags["AutoStop"]
            $weekdaysOnly = [bool]::Parse($vm.Tags["WeekdaysOnly"])
            
            # Skip weekends if weekdays only
            if ($weekdaysOnly -and ($currentDay -eq "Saturday" -or $currentDay -eq "Sunday")) {
                continue
            }
            
            # Convert schedule time
            $scheduleTime = [DateTime]::ParseExact($stopTime, "HH:mm", $null)
            $scheduleDateTime = Get-Date -Hour $scheduleTime.Hour -Minute $scheduleTime.Minute -Second 0
            
            # Check if it's time to stop (within 15-minute window)
            $timeDifference = ($currentTime - $scheduleDateTime).TotalMinutes
            
            if ($timeDifference -ge 0 -and $timeDifference -le 15) {
                $vmStatus = Get-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -Status
                $powerState = $vmStatus.Statuses | Where-Object { $_.Code -like "PowerState/*" }
                
                if ($powerState.Code -eq "PowerState/running") {
                    # Check VM utilization before stopping (safety check)
                    $shouldStop = Test-VMSafeToStop -VM $vm
                    
                    if ($shouldStop) {
                        Write-Host "Stopping VM: $($vm.Name)" -ForegroundColor Red
                        Stop-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -Force -AsJob
                        
                        # Log the action
                        Write-EventLog -LogName "Application" -Source "VM Scheduler" -EventId 1002 -Message "Stopped VM: $($vm.Name)"
                    } else {
                        Write-Host "VM $($vm.Name) has high utilization - skipping stop" -ForegroundColor Yellow
                    }
                }
            }
        }
    }
}

function Test-VMSafeToStop {
    param($VM)
    
    # Get recent CPU utilization (last 30 minutes)
    $endTime = Get-Date
    $startTime = $endTime.AddMinutes(-30)
    
    $cpuMetrics = Get-AzMetric -ResourceId $VM.Id -MetricName "Percentage CPU" -StartTime $startTime -EndTime $endTime -TimeGrain 00:05:00
    
    if ($cpuMetrics.Data) {
        $avgCpu = ($cpuMetrics.Data | Measure-Object Average -Average).Average
        
        # Don't stop if CPU > 20% (indicates active use)
        return $avgCpu -lt 20
    }
    
    return $true  # Default to safe to stop if no metrics available
}

# Main execution based on parameters
Connect-AzAccount
Set-AzContext -SubscriptionId $SubscriptionId

$schedule = $schedules[$ScheduleType]

if ($schedule -and $schedule.Enabled -ne $false) {
    # Apply schedule to VMs
    $vms = Get-AzVM -ResourceGroupName $ResourceGroupName
    foreach ($vm in $vms) {
        Set-VMScheduleTags -VM $vm -Schedule $schedule
    }
    
    Write-Host "Schedule applied to $($vms.Count) VMs in resource group: $ResourceGroupName" -ForegroundColor Green
} else {
    Write-Host "Invalid schedule type or schedule disabled" -ForegroundColor Red
}
```

### Azure Automation Integration

```powershell
# Create Azure Automation runbooks for VM scheduling
$AutomationAccountName = "vm-cost-optimization"
$ResourceGroupName = "automation-rg"

# Runbook for starting VMs
$StartVMRunbook = @"
param(
    [string]`$ResourceGroupName
)

`$connectionName = "AzureRunAsConnection"
try {
    `$servicePrincipalConnection = Get-AutomationConnection -Name `$connectionName
    Connect-AzAccount -ServicePrincipal -TenantId `$servicePrincipalConnection.TenantId -ApplicationId `$servicePrincipalConnection.ApplicationId -CertificateThumbprint `$servicePrincipalConnection.CertificateThumbprint
} catch {
    if (!`$servicePrincipalConnection) {
        throw "Connection `$connectionName not found."
    } else {
        throw `$_.Exception
    }
}

`$vms = Get-AzVM -ResourceGroupName `$ResourceGroupName | Where-Object { `$_.Tags["ScheduleEnabled"] -eq "True" }

foreach (`$vm in `$vms) {
    `$startTime = `$vm.Tags["AutoStart"]
    `$currentTime = Get-Date -Format "HH:mm"
    
    if (`$currentTime -eq `$startTime) {
        `$vmStatus = Get-AzVM -ResourceGroupName `$vm.ResourceGroupName -Name `$vm.Name -Status
        `$powerState = `$vmStatus.Statuses | Where-Object { `$_.Code -like "PowerState/*" }
        
        if (`$powerState.Code -eq "PowerState/deallocated") {
            Write-Output "Starting VM: `$(`$vm.Name)"
            Start-AzVM -ResourceGroupName `$vm.ResourceGroupName -Name `$vm.Name
        }
    }
}
"@

# Create the runbook
New-AzAutomationRunbook -AutomationAccountName $AutomationAccountName -ResourceGroupName $ResourceGroupName -Name "Start-ScheduledVMs" -Type PowerShell -Description "Start VMs based on schedule tags"

# Import the runbook content
Import-AzAutomationRunbook -AutomationAccountName $AutomationAccountName -ResourceGroupName $ResourceGroupName -Name "Start-ScheduledVMs" -Type PowerShell -Path $StartVMRunbook

# Create schedule for the runbook (run every hour during business hours)
New-AzAutomationSchedule -AutomationAccountName $AutomationAccountName -ResourceGroupName $ResourceGroupName -Name "BusinessHoursSchedule" -StartTime (Get-Date).AddHours(1) -HourInterval 1 -Description "Run every hour during business hours"

# Link the runbook to the schedule
Register-AzAutomationScheduledRunbook -AutomationAccountName $AutomationAccountName -ResourceGroupName $ResourceGroupName -RunbookName "Start-ScheduledVMs" -ScheduleName "BusinessHoursSchedule"
```

## Storage Optimization for VMs

### Disk Tier Analysis and Optimization

```bash
#!/bin/bash
# vm-storage-optimizer.sh

SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP=""

# Function to analyze disk usage
analyze_disk_performance() {
    local vm_name=$1
    local resource_group=$2
    
    echo "Analyzing disk performance for VM: $vm_name"
    
    # Get VM disk information
    disks=$(az vm show --name "$vm_name" --resource-group "$resource_group" --query "storageProfile.dataDisks[].managedDisk.id" -o tsv)
    os_disk=$(az vm show --name "$vm_name" --resource-group "$resource_group" --query "storageProfile.osDisk.managedDisk.id" -o tsv)
    
    # Analyze each disk
    for disk_id in $disks $os_disk; do
        disk_name=$(basename "$disk_id")
        
        # Get disk metrics (IOPS, throughput)
        end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        start_time=$(date -u -d "30 days ago" +"%Y-%m-%dT%H:%M:%SZ")
        
        # Get disk read/write operations
        read_ops=$(az monitor metrics list --resource "$disk_id" --metric "Composite Disk Read Operations/sec" --start-time "$start_time" --end-time "$end_time" --interval PT1H --aggregation Average --query "value[0].timeseries[0].data[].average" -o tsv | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        
        write_ops=$(az monitor metrics list --resource "$disk_id" --metric "Composite Disk Write Operations/sec" --start-time "$start_time" --end-time "$end_time" --interval PT1H --aggregation Average --query "value[0].timeseries[0].data[].average" -o tsv | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        
        # Get current disk SKU
        current_sku=$(az disk show --ids "$disk_id" --query "sku.name" -o tsv)
        current_size=$(az disk show --ids "$disk_id" --query "diskSizeGb" -o tsv)
        
        # Performance analysis
        total_iops=$(echo "$read_ops + $write_ops" | bc -l)
        
        echo "  Disk: $disk_name"
        echo "    Current SKU: $current_sku"
        echo "    Size: ${current_size}GB"
        echo "    Average IOPS: $total_iops"
        
        # Recommend optimization
        if (( $(echo "$total_iops < 100" | bc -l) )); then
            if [[ "$current_sku" == "Premium_LRS" ]]; then
                echo "    Recommendation: Downgrade to Standard_LRS (Low IOPS usage)"
                echo "    Potential Savings: 60-80%"
            fi
        elif (( $(echo "$total_iops > 3000" | bc -l) )); then
            if [[ "$current_sku" == "Standard_LRS" ]]; then
                echo "    Recommendation: Upgrade to Premium_LRS (High IOPS usage)"
                echo "    Performance Impact: Significant improvement expected"
            fi
        else
            echo "    Recommendation: Current configuration appears optimal"
        fi
        echo ""
    done
}

# Function to optimize disk configuration
optimize_disk_configuration() {
    local vm_name=$1
    local resource_group=$2
    local dry_run=${3:-true}
    
    echo "Optimizing disk configuration for VM: $vm_name"
    
    # Stop VM for disk changes
    if [[ "$dry_run" == "false" ]]; then
        echo "Stopping VM for disk optimization..."
        az vm deallocate --name "$vm_name" --resource-group "$resource_group"
    fi
    
    # Get current disk configuration
    disks=$(az vm show --name "$vm_name" --resource-group "$resource_group" --query "storageProfile.dataDisks[].{name:name,id:managedDisk.id,lun:lun}" -o json)
    
    echo "$disks" | jq -r '.[] | @base64' | while IFS= read -r disk_info; do
        disk_data=$(echo "$disk_info" | base64 -d)
        disk_id=$(echo "$disk_data" | jq -r '.id')
        disk_name=$(echo "$disk_data" | jq -r '.name')
        lun=$(echo "$disk_data" | jq -r '.lun')
        
        # Analyze disk and get recommendation
        current_sku=$(az disk show --ids "$disk_id" --query "sku.name" -o tsv)
        
        # Example optimization: Convert Premium to Standard for low-usage disks
        if [[ "$current_sku" == "Premium_LRS" ]]; then
            # Check if disk has low IOPS (this would be based on your analysis)
            echo "  Would convert $disk_name from Premium_LRS to Standard_LRS"
            
            if [[ "$dry_run" == "false" ]]; then
                # Create snapshot
                snapshot_name="${disk_name}-snapshot-$(date +%Y%m%d)"
                az snapshot create --resource-group "$resource_group" --name "$snapshot_name" --source "$disk_id"
                
                # Create new Standard disk from snapshot
                new_disk_name="${disk_name}-standard"
                az disk create --resource-group "$resource_group" --name "$new_disk_name" --source "$snapshot_name" --sku Standard_LRS
                
                # Detach old disk and attach new disk
                az vm disk detach --vm-name "$vm_name" --resource-group "$resource_group" --name "$disk_name"
                az vm disk attach --vm-name "$vm_name" --resource-group "$resource_group" --name "$new_disk_name" --lun "$lun"
                
                echo "  Optimized disk: $disk_name -> $new_disk_name"
            fi
        fi
    done
    
    # Start VM if we stopped it
    if [[ "$dry_run" == "false" ]]; then
        echo "Starting VM after optimization..."
        az vm start --name "$vm_name" --resource-group "$resource_group"
    fi
}

# Main execution
az account set --subscription "$SUBSCRIPTION_ID"

if [[ -n "$RESOURCE_GROUP" ]]; then
    vms=$(az vm list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv)
else
    vms=$(az vm list --query "[].name" -o tsv)
fi

for vm in $vms; do
    vm_rg=$(az vm show --name "$vm" --query "resourceGroup" -o tsv)
    analyze_disk_performance "$vm" "$vm_rg"
done

echo "Disk analysis complete. Run with --optimize flag to apply changes."
```

## Performance Monitoring and Alerting

### Comprehensive VM Monitoring Setup

```json
{
  "monitoringConfiguration": {
    "performanceCounters": [
      {
        "categoryName": "Processor",
        "counterName": "% Processor Time",
        "instanceName": "_Total",
        "intervalSeconds": 60,
        "threshold": {
          "warning": 80,
          "critical": 95
        }
      },
      {
        "categoryName": "Memory",
        "counterName": "% Committed Bytes In Use",
        "instanceName": "",
        "intervalSeconds": 60,
        "threshold": {
          "warning": 85,
          "critical": 95
        }
      },
      {
        "categoryName": "LogicalDisk",
        "counterName": "% Free Space",
        "instanceName": "_Total",
        "intervalSeconds": 300,
        "threshold": {
          "warning": 20,
          "critical": 10
        }
      },
      {
        "categoryName": "Network Interface",
        "counterName": "Bytes Total/sec",
        "instanceName": "*",
        "intervalSeconds": 60,
        "threshold": {
          "warning": 80000000,
          "critical": 95000000
        }
      }
    ],
    "customMetrics": [
      {
        "name": "VMCostEfficiency",
        "description": "Cost per unit of work performed",
        "calculation": "VM_Cost / (CPU_Utilization * Memory_Utilization)",
        "alertThreshold": 10.0
      }
    ],
    "logAnalyticsQueries": [
      {
        "name": "UnderutilizedVMs",
        "query": "Perf | where CounterName == \"% Processor Time\" and InstanceName == \"_Total\" | where TimeGenerated > ago(7d) | summarize AvgCPU = avg(CounterValue) by Computer | where AvgCPU < 10 | project Computer, AvgCPU",
        "schedule": "Daily",
        "alertThreshold": 5
      },
      {
        "name": "HighCostVMs",
        "query": "VMInsights | join kind=inner (Billing | where ServiceName == \"Virtual Machines\") on Computer | summarize TotalCost = sum(Cost), AvgUtilization = avg(CPUUtilization) by Computer | where TotalCost > 100 and AvgUtilization < 30",
        "schedule": "Weekly",
        "alertThreshold": 0
      }
    ]
  }
}
```

### Automated Cost Alert System

```python
# vm_cost_alert_system.py
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from azure.identity import DefaultAzureCredential
from azure.mgmt.monitor import MonitorManagementClient
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.consumption import ConsumptionManagementClient
from datetime import datetime, timedelta

class VMCostAlertSystem:
    def __init__(self, subscription_id, config):
        self.subscription_id = subscription_id
        self.config = config
        self.credential = DefaultAzureCredential()
        
        self.monitor_client = MonitorManagementClient(self.credential, subscription_id)
        self.compute_client = ComputeManagementClient(self.credential, subscription_id)
        self.consumption_client = ConsumptionManagementClient(self.credential, subscription_id)
    
    def analyze_vm_costs(self, days_back=7):
        """Analyze VM costs and identify alerts"""
        alerts = []
        
        # Get all VMs
        vms = list(self.compute_client.virtual_machines.list_all())
        
        for vm in vms:
            vm_analysis = self.analyze_single_vm(vm, days_back)
            if vm_analysis['alerts']:
                alerts.extend(vm_analysis['alerts'])
        
        return alerts
    
    def analyze_single_vm(self, vm, days_back):
        """Analyze a single VM for cost optimization opportunities"""
        vm_alerts = []
        
        # Get VM cost data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        try:
            # Get VM usage details
            usage_details = list(self.consumption_client.usage_details.list(
                scope=f"/subscriptions/{self.subscription_id}",
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d'),
                filter=f"properties/instanceName eq '{vm.name}'"
            ))
            
            if usage_details:
                total_cost = sum(usage.cost for usage in usage_details)
                daily_cost = total_cost / days_back
                
                # Get VM metrics
                vm_metrics = self.get_vm_metrics(vm.id, start_date, end_date)
                
                # Check for various alert conditions
                
                # 1. High cost with low utilization
                if (total_cost > self.config['cost_thresholds']['high_cost'] and 
                    vm_metrics['avg_cpu'] < self.config['utilization_thresholds']['low_cpu']):
                    vm_alerts.append({
                        'type': 'HIGH_COST_LOW_UTILIZATION',
                        'severity': 'HIGH',
                        'vm_name': vm.name,
                        'resource_group': vm.id.split('/')[4],
                        'cost': total_cost,
                        'daily_cost': daily_cost,
                        'avg_cpu': vm_metrics['avg_cpu'],
                        'recommendation': f'Consider downsizing or scheduling VM {vm.name}',
                        'potential_savings': daily_cost * 0.5 * 30  # Estimated 50% savings
                    })
                
                # 2. Idle VM (very low utilization)
                if vm_metrics['avg_cpu'] < self.config['utilization_thresholds']['idle_cpu']:
                    vm_alerts.append({
                        'type': 'IDLE_VM',
                        'severity': 'MEDIUM',
                        'vm_name': vm.name,
                        'resource_group': vm.id.split('/')[4],
                        'cost': total_cost,
                        'avg_cpu': vm_metrics['avg_cpu'],
                        'recommendation': f'VM {vm.name} appears to be idle - consider stopping or deleting',
                        'potential_savings': total_cost
                    })
                
                # 3. Expensive VM with moderate utilization (right-sizing opportunity)
                elif (total_cost > self.config['cost_thresholds']['medium_cost'] and 
                      vm_metrics['avg_cpu'] < self.config['utilization_thresholds']['moderate_cpu']):
                    vm_alerts.append({
                        'type': 'RIGHTSIZING_OPPORTUNITY',
                        'severity': 'MEDIUM',
                        'vm_name': vm.name,
                        'resource_group': vm.id.split('/')[4],
                        'cost': total_cost,
                        'avg_cpu': vm_metrics['avg_cpu'],
                        'recommendation': f'Consider right-sizing VM {vm.name} to a smaller instance',
                        'potential_savings': daily_cost * 0.3 * 30  # Estimated 30% savings
                    })
                
                # 4. Storage optimization opportunity
                if vm_metrics['disk_utilization'] < self.config['utilization_thresholds']['low_disk']:
                    storage_cost = self.estimate_storage_cost(vm)
                    if storage_cost > self.config['cost_thresholds']['storage_optimization']:
                        vm_alerts.append({
                            'type': 'STORAGE_OPTIMIZATION',
                            'severity': 'LOW',
                            'vm_name': vm.name,
                            'resource_group': vm.id.split('/')[4],
                            'storage_cost': storage_cost,
                            'disk_utilization': vm_metrics['disk_utilization'],
                            'recommendation': f'Consider optimizing storage tiers for VM {vm.name}',
                            'potential_savings': storage_cost * 0.4  # Estimated 40% storage savings
                        })
                
        except Exception as e:
            print(f"Error analyzing VM {vm.name}: {e}")
        
        return {'vm_name': vm.name, 'alerts': vm_alerts}
    
    def get_vm_metrics(self, vm_id, start_time, end_time):
        """Get VM performance metrics"""
        try:
            # CPU metrics
            cpu_metrics = self.monitor_client.metrics.list(
                resource_uri=vm_id,
                metricnames="Percentage CPU",
                timespan=f"{start_time.isoformat()}/{end_time.isoformat()}",
                interval="PT1H",
                aggregation="Average"
            )
            
            cpu_values = []
            for metric in cpu_metrics.value:
                if metric.timeseries:
                    for data_point in metric.timeseries[0].data:
                        if data_point.average is not None:
                            cpu_values.append(data_point.average)
            
            avg_cpu = sum(cpu_values) / len(cpu_values) if cpu_values else 0
            
            # Simplified disk utilization (would need more complex logic in practice)
            disk_utilization = 50  # Placeholder
            
            return {
                'avg_cpu': avg_cpu,
                'disk_utilization': disk_utilization
            }
            
        except Exception as e:
            print(f"Error getting metrics for VM {vm_id}: {e}")
            return {'avg_cpu': 0, 'disk_utilization': 0}
    
    def estimate_storage_cost(self, vm):
        """Estimate storage cost for a VM"""
        # Simplified storage cost estimation
        # In practice, this would analyze actual disk configurations and pricing
        return 50.0  # Placeholder
    
    def send_alert_report(self, alerts):
        """Send alert report via email"""
        if not alerts:
            return
        
        # Group alerts by severity
        high_alerts = [a for a in alerts if a['severity'] == 'HIGH']
        medium_alerts = [a for a in alerts if a['severity'] == 'MEDIUM']
        low_alerts = [a for a in alerts if a['severity'] == 'LOW']
        
        # Calculate total potential savings
        total_savings = sum(alert.get('potential_savings', 0) for alert in alerts)
        
        # Create email content
        email_body = f"""
        Azure VM Cost Optimization Alert Report
        =====================================
        
        Total Potential Monthly Savings: ${total_savings:.2f}
        
        HIGH PRIORITY ALERTS ({len(high_alerts)}):
        """
        
        for alert in high_alerts:
            email_body += f"""
        - {alert['vm_name']} ({alert['resource_group']})
          Issue: {alert['type']}
          Cost: ${alert.get('cost', 0):.2f}
          Recommendation: {alert['recommendation']}
          Potential Savings: ${alert.get('potential_savings', 0):.2f}/month
        """
        
        email_body += f"""
        
        MEDIUM PRIORITY ALERTS ({len(medium_alerts)}):
        """
        
        for alert in medium_alerts[:5]:  # Show top 5 medium alerts
            email_body += f"""
        - {alert['vm_name']}: {alert['recommendation']}
          Potential Savings: ${alert.get('potential_savings', 0):.2f}/month
        """
        
        # Send email
        self.send_email(
            subject=f"VM Cost Optimization Alert - ${total_savings:.2f} Potential Savings",
            body=email_body
        )
    
    def send_email(self, subject, body):
        """Send email notification"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.config['email']['from_address']
            msg['To'] = ', '.join(self.config['email']['to_addresses'])
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.config['email']['smtp_server'], 587)
            server.starttls()
            server.login(self.config['email']['username'], self.config['email']['password'])
            
            text = msg.as_string()
            server.sendmail(self.config['email']['from_address'], self.config['email']['to_addresses'], text)
            server.quit()
            
            print("Alert email sent successfully")
            
        except Exception as e:
            print(f"Error sending email: {e}")

# Configuration
config = {
    'cost_thresholds': {
        'high_cost': 200,  # $200 per week
        'medium_cost': 100,  # $100 per week
        'storage_optimization': 20  # $20 storage cost
    },
    'utilization_thresholds': {
        'low_cpu': 10,  # 10% CPU utilization
        'idle_cpu': 5,   # 5% CPU utilization
        'moderate_cpu': 30,  # 30% CPU utilization
        'low_disk': 20   # 20% disk utilization
    },
    'email': {
        'smtp_server': 'smtp.gmail.com',
        'from_address': 'alerts@yourcompany.com',
        'to_addresses': ['admin@yourcompany.com'],
        'username': 'your-username',
        'password': 'your-password'
    }
}

# Usage
subscription_id = "your-subscription-id"
alert_system = VMCostAlertSystem(subscription_id, config)
alerts = alert_system.analyze_vm_costs(7)  # Analyze last 7 days
alert_system.send_alert_report(alerts)

print(f"Found {len(alerts)} cost optimization opportunities")
for alert in alerts[:5]:  # Show top 5 alerts
    print(f"- {alert['vm_name']}: {alert['recommendation']}")
```

## Best Practices Summary

### Implementation Roadmap

#### Week 1-2: Assessment
- [ ] Deploy VM analysis scripts
- [ ] Establish cost baseline
- [ ] Identify quick wins (idle VMs)
- [ ] Set up basic monitoring

#### Week 3-4: Quick Optimizations
- [ ] Implement VM scheduling for dev/test
- [ ] Right-size obviously over-provisioned VMs
- [ ] Optimize storage tiers
- [ ] Clean up orphaned resources

#### Week 5-8: Advanced Optimization
- [ ] Deploy automated scheduling
- [ ] Implement performance monitoring
- [ ] Set up cost alerting
- [ ] Create optimization runbooks

#### Ongoing: Continuous Improvement
- [ ] Monthly cost reviews
- [ ] Quarterly right-sizing analysis
- [ ] Technology updates evaluation
- [ ] Team training and education

### Key Success Metrics
- **Cost Reduction**: Target 40-60% reduction in VM costs
- **Performance Maintenance**: No degradation in application performance
- **Availability**: Maintain or improve uptime
- **Operational Efficiency**: Reduce manual management overhead

### Common Pitfalls to Avoid
1. **Over-aggressive downsizing**: Always validate performance impact
2. **Ignoring application requirements**: Consider peak usage patterns
3. **Poor scheduling coordination**: Ensure dependent services are aligned
4. **Insufficient monitoring**: Monitor both cost and performance metrics
5. **Lack of governance**: Establish clear policies and procedures

## Real-World Impact

**Case Study**: A software development company reduced their Azure VM costs from $15,000 to $6,000 per month (60% reduction) through:

1. **Right-sizing analysis**: Identified 40% of VMs were over-provisioned
2. **Automated scheduling**: Implemented start/stop for 70% of development VMs
3. **Storage optimization**: Moved 60% of storage from Premium to Standard tiers
4. **Performance monitoring**: Maintained 99.9% application availability

**Key Results**:
- Monthly savings: $9,000
- Performance impact: None (improved in some cases)
- Management overhead: Reduced by 50%
- Team productivity: Increased due to better resource availability

Azure VM cost optimization requires a systematic approach combining analysis, automation, and continuous monitoring. Start with the highest-impact optimizations and gradually implement more sophisticated techniques as your expertise grows.
