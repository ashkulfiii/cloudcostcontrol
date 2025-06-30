---
title: "Why Your Azure Bill Doubled This Month (And How to Fix It)"
description: "Diagnose and resolve sudden Azure cost spikes with our comprehensive troubleshooting guide. Learn to identify the root causes and implement immediate fixes."
pubDate: 2025-09-01
tags: ["azure", "cost-spike", "troubleshooting", "bill-shock", "emergency"]
author: "C³ - Cloud Cost Control"
---

# Why Your Azure Bill Doubled This Month (And How to Fix It)

"Our Azure bill went from $5,000 to $12,000 overnight!" If you're reading this with panic in your eyes, you're not alone. Azure cost spikes affect 60% of organizations at some point, but they're almost always fixable within hours if you know what to look for. This emergency guide will help you identify the culprit and stop the bleeding immediately.

## Emergency Cost Spike Response Plan

### Step 1: Stop the Bleeding (Do This First - 5 minutes)

#### Immediate Actions Checklist
```
⚠️  CRITICAL: Take these actions within the first hour

□ Check for runaway auto-scaling (most common cause)
□ Look for new expensive resource deployments  
□ Verify no accidental region changes
□ Check for data transfer spikes
□ Review recent configuration changes
□ Stop/deallocate obviously oversized resources
□ Set emergency spending limits
```

#### Quick Cost Analysis Script
```powershell
# Emergency Azure cost spike analysis
param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [int]$DaysToAnalyze = 7
)

Write-Host "🚨 EMERGENCY COST SPIKE ANALYSIS 🚨" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red

# Get current spending for today
$today = Get-Date -Format "yyyy-MM-dd"
$weekAgo = (Get-Date).AddDays(-$DaysToAnalyze).ToString("yyyy-MM-dd")

# Quick resource inventory
Write-Host "`n1. CHECKING FOR EXPENSIVE RESOURCES..." -ForegroundColor Yellow

# Find large VMs
$largeVMs = Get-AzVM | Where-Object {
    $_.HardwareProfile.VmSize -like "*_D32*" -or
    $_.HardwareProfile.VmSize -like "*_D64*" -or
    $_.HardwareProfile.VmSize -like "*_E32*" -or
    $_.HardwareProfile.VmSize -like "*_E64*" -or
    $_.HardwareProfile.VmSize -like "*_F32*" -or
    $_.HardwareProfile.VmSize -like "*_F64*"
}

if ($largeVMs.Count -gt 0) {
    Write-Host "   ⚠️  FOUND LARGE VMs (Potential cost: $500-2000/month each):" -ForegroundColor Red
    foreach ($vm in $largeVMs) {
        $estimatedCost = switch -Wildcard ($vm.HardwareProfile.VmSize) {
            "*D32*" { "$1,400-1,800" }
            "*D64*" { "$2,800-3,600" }
            "*E32*" { "$1,600-2,000" }
            "*E64*" { "$3,200-4,000" }
            default { "$800-1,500" }
        }
        Write-Host "     • $($vm.Name) - $($vm.HardwareProfile.VmSize) - Est: $estimatedCost/month" -ForegroundColor White
        
        # Get VM status
        $vmStatus = Get-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -Status
        $powerState = ($vmStatus.Statuses | Where-Object {$_.Code -like "PowerState/*"}).DisplayStatus
        Write-Host "       Status: $powerState" -ForegroundColor Cyan
        
        if ($powerState -eq "VM running") {
            Write-Host "       💡 ACTION: Consider stopping if not needed: Stop-AzVM -ResourceGroupName '$($vm.ResourceGroupName)' -Name '$($vm.Name)' -Force" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ✅ No obviously oversized VMs found" -ForegroundColor Green
}

# Check for premium storage
Write-Host "`n2. CHECKING FOR PREMIUM STORAGE..." -ForegroundColor Yellow
$premiumDisks = Get-AzDisk | Where-Object {$_.Sku.Name -like "*Premium*"}
if ($premiumDisks.Count -gt 0) {
    $totalPremiumCost = ($premiumDisks | Measure-Object -Property DiskSizeGB -Sum).Sum * 0.135
    Write-Host "   ⚠️  FOUND PREMIUM DISKS: $($premiumDisks.Count) disks, ~$$([math]::Round($totalPremiumCost, 2))/month" -ForegroundColor Red
    
    # Show top 5 largest premium disks
    $topDisks = $premiumDisks | Sort-Object DiskSizeGB -Descending | Select-Object -First 5
    foreach ($disk in $topDisks) {
        $monthlyCost = $disk.DiskSizeGB * 0.135
        Write-Host "     • $($disk.Name): $($disk.DiskSizeGB)GB - $([math]::Round($monthlyCost, 2))/month" -ForegroundColor White
    }
} else {
    Write-Host "   ✅ No premium disks found" -ForegroundColor Green
}

# Check for running but stopped VMs (common mistake)
Write-Host "`n3. CHECKING FOR STOPPED (NOT DEALLOCATED) VMs..." -ForegroundColor Yellow
$allVMs = Get-AzVM -Status
$stoppedVMs = $allVMs | Where-Object {
    ($_.Statuses | Where-Object {$_.Code -like "PowerState/*"}).DisplayStatus -eq "VM stopped"
}

if ($stoppedVMs.Count -gt 0) {
    Write-Host "   ⚠️  FOUND STOPPED VMs STILL BILLING: $($stoppedVMs.Count) VMs" -ForegroundColor Red
    foreach ($vm in $stoppedVMs) {
        Write-Host "     • $($vm.Name) - STILL BILLING! Deallocate immediately!" -ForegroundColor Red
        Write-Host "       Fix: Stop-AzVM -ResourceGroupName '$($vm.ResourceGroupName)' -Name '$($vm.Name)' -Force" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ No stopped VMs found that are still billing" -ForegroundColor Green
}

# Check for high-cost services
Write-Host "`n4. CHECKING FOR HIGH-COST SERVICES..." -ForegroundColor Yellow

# Check Application Gateways
$appGateways = Get-AzApplicationGateway
if ($appGateways.Count -gt 0) {
    $appGwCost = $appGateways.Count * 125  # Approximate monthly cost
    Write-Host "   💰 Application Gateways: $($appGateways.Count) found - ~$$appGwCost/month" -ForegroundColor Yellow
}

# Check Load Balancers
$loadBalancers = Get-AzLoadBalancer
if ($loadBalancers.Count -gt 0) {
    $lbCost = $loadBalancers.Count * 18
    Write-Host "   💰 Load Balancers: $($loadBalancers.Count) found - ~$$lbCost/month" -ForegroundColor Yellow
}

# Check for Cosmos DB accounts
$cosmosAccounts = Get-AzCosmosDBAccount
if ($cosmosAccounts.Count -gt 0) {
    Write-Host "   ⚠️  Cosmos DB Accounts: $($cosmosAccounts.Count) found - CHECK THROUGHPUT SETTINGS!" -ForegroundColor Red
    Write-Host "       Cosmos DB can auto-scale and cost $1000s/month. Check Azure portal immediately." -ForegroundColor Yellow
}

Write-Host "`n5. EMERGENCY RECOMMENDATIONS:" -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red
Write-Host "🔥 IMMEDIATE ACTIONS (do now):" -ForegroundColor Red
Write-Host "   1. Stop/deallocate any unnecessary large VMs" -ForegroundColor White
Write-Host "   2. Check Cosmos DB throughput settings in portal" -ForegroundColor White
Write-Host "   3. Review auto-scaling settings on App Services" -ForegroundColor White
Write-Host "   4. Check for any new deployments in the last 24-48 hours" -ForegroundColor White
Write-Host "`n💡 NEXT STEPS (within 2 hours):" -ForegroundColor Yellow
Write-Host "   1. Set up cost alerts and budgets" -ForegroundColor White
Write-Host "   2. Review detailed cost analysis in Azure portal" -ForegroundColor White
Write-Host "   3. Implement resource tagging for better tracking" -ForegroundColor White
Write-Host "   4. Document what caused the spike for future prevention" -ForegroundColor White

Write-Host "`n📞 Need immediate help? Contact our emergency cost support!" -ForegroundColor Green
```

### Step 2: Identify the Culprit (15 minutes)

#### Azure Portal Investigation Path
```
1. Azure Portal → Cost Management + Billing → Cost Analysis
2. Set time range to "Last 7 days" and granularity to "Daily"
3. Group by: "Service name" 
4. Look for sudden spikes in the chart
5. Drill down into the service showing the spike
6. Group by "Resource" to find the specific culprit
```

#### Common Cost Spike Patterns
```
Pattern 1: Vertical Line Spike
📈 Sudden jump on specific date
🔍 Cause: New resource deployment or configuration change
🎯 Fix: Identify and right-size/remove the resource

Pattern 2: Gradual Ramp Up
📈 Steady increase over several days
🔍 Cause: Auto-scaling or growing data volumes
🎯 Fix: Adjust auto-scaling limits or optimize data retention

Pattern 3: Weekend/Holiday Spike
📈 High costs during non-business hours
🔍 Cause: Resources running when they should be stopped
🎯 Fix: Implement auto-shutdown schedules

Pattern 4: Multiple Service Spike
📈 Several services increasing simultaneously
🔍 Cause: Infrastructure-wide change or new application deployment
🎯 Fix: Review recent deployments and configurations
```

## The Top 10 Azure Cost Spike Culprits

### 1. Runaway Auto-Scaling (40% of cases)

**Symptoms:**
- App Service costs jumped 5-20x overnight
- Multiple instances of the same service running
- High CPU/memory alerts followed by cost spike

**Emergency Fix:**
```bash
# Check current App Service instances
az appservice plan list --query "[].{name:name,sku:sku.name,instances:numberOfWorkers}" -o table

# Immediately scale down
az appservice plan update --name "your-app-service-plan" --resource-group "your-rg" --number-of-workers 1

# Disable auto-scaling temporarily
az monitor autoscale delete --name "your-autoscale-setting" --resource-group "your-rg"
```

**Permanent Solution:**
```json
{
  "autoscale_settings": {
    "minimum_instances": 1,
    "maximum_instances": 5,
    "scale_out_threshold": 80,
    "scale_in_threshold": 20,
    "scale_out_cooldown": "PT10M",
    "scale_in_cooldown": "PT10M"
  }
}
```

### 2. Cosmos DB Throughput Explosion (25% of cases)

**Symptoms:**
- Cosmos DB charges jumped from $50 to $2,000+/month
- High Request Unit (RU) consumption
- Auto-scaling enabled without limits

**Emergency Fix:**
```powershell
# Check current Cosmos DB throughput
$cosmosAccounts = Get-AzCosmosDBAccount
foreach ($account in $cosmosAccounts) {
    Write-Host "Account: $($account.Name)"
    
    # Get databases
    $databases = Get-AzCosmosDBSqlDatabase -ResourceGroupName $account.ResourceGroupName -AccountName $account.Name
    foreach ($db in $databases) {
        # Check throughput
        $throughput = Get-AzCosmosDBSqlDatabaseThroughput -ResourceGroupName $account.ResourceGroupName -AccountName $account.Name -Name $db.Name
        Write-Host "  Database: $($db.Name) - Throughput: $($throughput.Throughput) RU/s"
        
        # If throughput is over 1000 RU/s, consider reducing
        if ($throughput.Throughput -gt 1000) {
            Write-Host "    ⚠️  HIGH THROUGHPUT! Consider reducing to 400-1000 RU/s" -ForegroundColor Red
            # Uncomment to automatically reduce (use with caution)
            # Update-AzCosmosDBSqlDatabaseThroughput -ResourceGroupName $account.ResourceGroupName -AccountName $account.Name -Name $db.Name -Throughput 400
        }
    }
}
```

**Prevention Script:**
```python
# Set maximum throughput limits on Cosmos DB
import azure.cosmos.cosmos_client as cosmos_client

def set_cosmos_spending_limits(endpoint, key, max_ru_per_database=1000):
    client = cosmos_client.CosmosClient(endpoint, key)
    
    # List all databases
    databases = list(client.list_databases())
    
    for database in databases:
        db_client = client.get_database_client(database['id'])
        
        # Check current throughput
        try:
            current_throughput = db_client.read_offer()
            if current_throughput:
                current_ru = current_throughput['content']['offerThroughput']
                
                if current_ru > max_ru_per_database:
                    print(f"Database {database['id']}: Reducing from {current_ru} to {max_ru_per_database} RU/s")
                    
                    # Update throughput (uncomment to execute)
                    # new_offer = current_throughput
                    # new_offer['content']['offerThroughput'] = max_ru_per_database
                    # db_client.replace_offer(new_offer)
                    
        except Exception as e:
            print(f"Could not check throughput for {database['id']}: {str(e)}")

# Usage
set_cosmos_spending_limits("your-cosmos-endpoint", "your-primary-key", max_ru_per_database=1000)
```

### 3. Accidental Premium Storage Deployment (15% of cases)

**Symptoms:**
- Storage costs 3-10x higher than expected
- Recent VM or disk deployments
- Premium_LRS disks in development environments

**Emergency Fix:**
```powershell
# Find and replace premium disks with standard ones
$premiumDisks = Get-AzDisk | Where-Object {$_.Sku.Name -eq "Premium_LRS"}

foreach ($disk in $premiumDisks) {
    $monthlyCost = $disk.DiskSizeGB * 0.135
    Write-Host "Premium Disk: $($disk.Name) - $($disk.DiskSizeGB)GB - Cost: $$([math]::Round($monthlyCost, 2))/month" -ForegroundColor Red
    
    # Check if disk is attached
    if ($disk.DiskState -eq "Unattached") {
        Write-Host "  💡 Unattached premium disk - consider deleting or converting to standard" -ForegroundColor Yellow
    }
    elseif ($disk.DiskState -eq "Attached") {
        # Check environment tag
        if ($disk.Tags["Environment"] -ne "Production") {
            Write-Host "  💡 Non-production premium disk - consider converting to standard storage" -ForegroundColor Yellow
            Write-Host "     1. Snapshot the disk: New-AzSnapshot" -ForegroundColor Green
            Write-Host "     2. Create standard disk from snapshot" -ForegroundColor Green
            Write-Host "     3. Swap disks on VM" -ForegroundColor Green
        }
    }
}
```

### 4. Data Transfer Cost Explosion (10% of cases)

**Symptoms:**
- Bandwidth charges jumped from $50 to $1,000+
- High outbound data transfer
- Recent architecture changes

**Investigation Script:**
```bash
# Check bandwidth usage patterns
az monitor metrics list --resource "/subscriptions/your-sub/resourceGroups/your-rg" \
  --metric "Network Out Total" \
  --start-time "2025-06-23T00:00:00Z" \
  --end-time "2025-06-30T23:59:59Z" \
  --interval PT1H \
  --aggregation Total

# Look for:
# - Sudden spikes in network out traffic
# - Consistent high traffic patterns
# - Traffic during unexpected hours
```

**Emergency Fixes:**
```
1. Implement Azure CDN for static content
2. Review data sync processes
3. Check for inefficient API calls
4. Verify backup processes aren't sending data externally
5. Look for data exfiltration (security concern)
```

### 5. Forgotten Test/Development Resources (8% of cases)

**Symptoms:**
- Costs continue outside business hours
- Resources tagged as "test" or "dev" with high costs
- Multiple similar environments

**Cleanup Script:**
```bash
#!/bin/bash
# Emergency development environment cleanup

echo "🧹 EMERGENCY DEV ENVIRONMENT CLEANUP"
echo "======================================"

# Find development resource groups
dev_rgs=$(az group list --query "[?tags.Environment=='Development'].name" -o tsv)

total_monthly_savings=0

for rg in $dev_rgs; do
    echo "Checking resource group: $rg"
    
    # Get VMs in the resource group
    vms=$(az vm list --resource-group "$rg" --query "[].{name:name,size:hardwareProfile.vmSize,status:instanceView.statuses[1].displayStatus}" -o tsv)
    
    if [ ! -z "$vms" ]; then
        echo "  VMs found in $rg:"
        while IFS=$'\t' read -r vm_name vm_size vm_status; do
            # Estimate monthly cost
            case $vm_size in
                *D2s*) cost=96 ;;
                *D4s*) cost=192 ;;
                *D8s*) cost=384 ;;
                *B1s*) cost=9 ;;
                *B2s*) cost=35 ;;
                *) cost=50 ;;
            esac
            
            echo "    • $vm_name ($vm_size) - Status: $vm_status - Est: \$${cost}/month"
            
            if [[ "$vm_status" == "VM running" ]]; then
                echo "      💡 STOP THIS VM: az vm deallocate --name '$vm_name' --resource-group '$rg' --no-wait"
                total_monthly_savings=$((total_monthly_savings + cost))
            fi
        done <<< "$vms"
    fi
    
    # Check for expensive services
    app_services=$(az webapp list --resource-group "$rg" --query "[].{name:name,sku:appServicePlanId}" -o tsv)
    if [ ! -z "$app_services" ]; then
        echo "  💰 App Services found - check pricing tiers!"
    fi
done

echo ""
echo "💰 POTENTIAL MONTHLY SAVINGS: \$${total_monthly_savings}"
echo "🚀 Run the suggested commands to stop unnecessary VMs immediately!"
```

## Advanced Cost Spike Diagnosis

### Using Azure Cost Management APIs

```python
# Advanced cost spike analysis using Azure APIs
import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

class CostSpikeAnalyzer:
    def __init__(self, subscription_id, access_token):
        self.subscription_id = subscription_id
        self.access_token = access_token
        self.base_url = f"https://management.azure.com/subscriptions/{subscription_id}"
        
    def analyze_cost_spike(self, spike_date, lookback_days=14):
        """
        Comprehensive cost spike analysis
        """
        # Get cost data for analysis period
        end_date = datetime.strptime(spike_date, '%Y-%m-%d')
        start_date = end_date - timedelta(days=lookback_days)
        
        # Fetch daily costs
        daily_costs = self._get_daily_costs(start_date, end_date)
        
        # Detect anomalies
        anomalies = self._detect_cost_anomalies(daily_costs)
        
        # Analyze by service
        service_analysis = self._analyze_by_service(spike_date)
        
        # Generate recommendations
        recommendations = self._generate_spike_recommendations(anomalies, service_analysis)
        
        return {
            'daily_costs': daily_costs,
            'anomalies': anomalies,
            'service_analysis': service_analysis,
            'recommendations': recommendations
        }
    
    def _get_daily_costs(self, start_date, end_date):
        """Get daily cost breakdown"""
        url = f"{self.base_url}/providers/Microsoft.CostManagement/query"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        body = {
            "type": "ActualCost",
            "timeframe": "Custom",
            "timePeriod": {
                "from": start_date.strftime('%Y-%m-%d'),
                "to": end_date.strftime('%Y-%m-%d')
            },
            "dataset": {
                "granularity": "Daily",
                "aggregation": {
                    "totalCost": {"name": "PreTaxCost", "function": "Sum"}
                },
                "grouping": [
                    {"type": "Dimension", "name": "ServiceName"}
                ]
            }
        }
        
        response = requests.post(url, headers=headers, json=body)
        return response.json()
    
    def _detect_cost_anomalies(self, daily_costs):
        """Detect cost anomalies using statistical analysis"""
        # Convert to DataFrame for analysis
        df = pd.DataFrame(daily_costs['properties']['rows'], 
                         columns=['Date', 'ServiceName', 'Cost'])
        
        # Calculate daily totals
        daily_totals = df.groupby('Date')['Cost'].sum().reset_index()
        daily_totals['Date'] = pd.to_datetime(daily_totals['Date'])
        
        # Calculate rolling statistics
        daily_totals['rolling_mean'] = daily_totals['Cost'].rolling(window=7).mean()
        daily_totals['rolling_std'] = daily_totals['Cost'].rolling(window=7).std()
        
        # Detect anomalies (costs > 2 standard deviations above mean)
        anomalies = []
        for _, row in daily_totals.iterrows():
            if row['rolling_mean'] and row['rolling_std']:
                threshold = row['rolling_mean'] + (2 * row['rolling_std'])
                if row['Cost'] > threshold:
                    anomalies.append({
                        'date': row['Date'].strftime('%Y-%m-%d'),
                        'cost': row['Cost'],
                        'expected_cost': row['rolling_mean'],
                        'deviation': row['Cost'] - row['rolling_mean'],
                        'severity': 'High' if row['Cost'] > (row['rolling_mean'] + 3 * row['rolling_std']) else 'Medium'
                    })
        
        return anomalies
    
    def _analyze_by_service(self, spike_date):
        """Analyze cost spike by Azure service"""
        # Get service breakdown for spike date
        url = f"{self.base_url}/providers/Microsoft.CostManagement/query"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        body = {
            "type": "ActualCost",
            "timeframe": "Custom",
            "timePeriod": {
                "from": spike_date,
                "to": spike_date
            },
            "dataset": {
                "granularity": "Daily",
                "aggregation": {
                    "totalCost": {"name": "PreTaxCost", "function": "Sum"}
                },
                "grouping": [
                    {"type": "Dimension", "name": "ServiceName"},
                    {"type": "Dimension", "name": "ResourceLocation"}
                ]
            }
        }
        
        response = requests.post(url, headers=headers, json=body)
        data = response.json()
        
        # Analyze service costs
        service_costs = {}
        for row in data['properties']['rows']:
            service = row[1]
            cost = row[3]
            if service in service_costs:
                service_costs[service] += cost
            else:
                service_costs[service] = cost
        
        # Sort by cost
        sorted_services = sorted(service_costs.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_services[:10]  # Top 10 services
    
    def _generate_spike_recommendations(self, anomalies, service_analysis):
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Analyze top cost drivers
        for service, cost in service_analysis[:5]:
            if service == "Virtual Machines":
                recommendations.append({
                    'priority': 'High',
                    'service': service,
                    'issue': 'High VM costs detected',
                    'action': 'Check for oversized VMs or runaway auto-scaling',
                    'script': 'Get-AzVM | Where-Object {$_.HardwareProfile.VmSize -like "*_D32*" -or $_.HardwareProfile.VmSize -like "*_D64*"}'
                })
            elif service == "Azure Cosmos DB":
                recommendations.append({
                    'priority': 'Critical',
                    'service': service,
                    'issue': 'High Cosmos DB costs detected',
                    'action': 'Check throughput settings and auto-scaling configuration',
                    'script': 'Get-AzCosmosDBAccount | Get-AzCosmosDBSqlDatabaseThroughput'
                })
            elif service == "Bandwidth":
                recommendations.append({
                    'priority': 'Medium',
                    'service': service,
                    'issue': 'High data transfer costs detected',
                    'action': 'Review data movement patterns and implement CDN',
                    'script': 'Check Azure Monitor for "Network Out Total" metrics'
                })
            elif service == "Storage":
                recommendations.append({
                    'priority': 'Medium',
                    'service': service,
                    'issue': 'High storage costs detected',
                    'action': 'Check for premium storage usage and implement lifecycle policies',
                    'script': 'Get-AzDisk | Where-Object {$_.Sku.Name -like "*Premium*"}'
                })
        
        return recommendations

# Usage example
analyzer = CostSpikeAnalyzer("your-subscription-id", "your-access-token")
analysis = analyzer.analyze_cost_spike("2025-06-25", lookback_days=14)

print("Cost Spike Analysis Report")
print("=" * 50)
print(f"Anomalies detected: {len(analysis['anomalies'])}")
print(f"Top cost driver: {analysis['service_analysis'][0][0]} (${analysis['service_analysis'][0][1]:.2f})")
print(f"Recommendations: {len(analysis['recommendations'])}")
```

## Prevention Strategies

### 1. Early Warning System

```python
# Cost spike early warning system
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta

class CostSpikeEarlyWarning:
    def __init__(self, smtp_config):
        self.smtp_config = smtp_config
        
    def check_daily_spending(self, subscription_id, threshold_multiplier=1.5):
        """Check if today's spending exceeds threshold"""
        
        # Get spending data (simplified - use Azure Cost Management API)
        today_cost = self._get_today_cost(subscription_id)
        avg_daily_cost = self._get_average_daily_cost(subscription_id, days=30)
        
        if today_cost > (avg_daily_cost * threshold_multiplier):
            self._send_early_warning_alert({
                'subscription_id': subscription_id,
                'today_cost': today_cost,
                'average_cost': avg_daily_cost,
                'spike_percentage': ((today_cost / avg_daily_cost) - 1) * 100,
                'threshold': threshold_multiplier
            })
    
    def _send_early_warning_alert(self, alert_data):
        """Send early warning email"""
        subject = f"🚨 Azure Cost Spike Early Warning - {alert_data['spike_percentage']:.1f}% above normal"
        
        body = f"""
        Early Warning: Potential Cost Spike Detected
        
        Subscription: {alert_data['subscription_id']}
        Today's Cost: ${alert_data['today_cost']:.2f}
        30-day Average: ${alert_data['average_cost']:.2f}
        Spike: {alert_data['spike_percentage']:.1f}% above normal
        
        Recommended Actions:
        1. Check for new resource deployments
        2. Review auto-scaling settings
        3. Look for configuration changes
        4. Monitor costs throughout the day
        
        Access Azure Cost Management: 
        https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/costanalysis
        """
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = self.smtp_config['from_email']
        msg['To'] = ', '.join(self.smtp_config['to_emails'])
        
        # Send email (implement SMTP sending)
        print(f"Early warning alert sent: {subject}")

# Set up daily monitoring
warning_system = CostSpikeEarlyWarning({
    'from_email': 'azure-alerts@company.com',
    'to_emails': ['finance@company.com', 'devops@company.com']
})

# Run daily check
warning_system.check_daily_spending("your-subscription-id", threshold_multiplier=1.3)
```

### 2. Resource Deployment Approval Workflow

```yaml
# Azure DevOps pipeline with cost checks
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - infrastructure/*

variables:
  - name: maxMonthlyCost
    value: 1000

stages:
- stage: CostEstimation
  displayName: 'Estimate Deployment Cost'
  jobs:
  - job: EstimateCost
    displayName: 'Estimate Infrastructure Cost'
    steps:
    - task: AzureCLI@2
      displayName: 'Run Cost Estimation'
      inputs:
        azureSubscription: 'Azure-Connection'
        scriptType: 'bash'
        scriptLocation: 'inlineScript'
        inlineScript: |
          # Estimate cost using ARM template
          echo "Estimating deployment cost..."
          
          # Parse ARM template and estimate costs
          estimated_cost=$(python3 scripts/estimate-cost.py --template infrastructure/main.json)
          
          echo "Estimated monthly cost: $estimated_cost"
          
          if (( $(echo "$estimated_cost > $(maxMonthlyCost)" | bc -l) )); then
            echo "##vso[task.logissue type=error]Estimated cost ($estimated_cost) exceeds limit ($(maxMonthlyCost))"
            exit 1
          fi

- stage: ManualApproval
  displayName: 'Manual Approval for High Cost'
  condition: and(succeeded(), gt(variables.estimatedCost, variables.maxMonthlyCost))
  jobs:
  - job: WaitForValidation
    displayName: 'Wait for manual validation'
    pool: server
    timeoutInMinutes: 1440 # 24 hours
    steps:
    - task: ManualValidation@0
      displayName: 'Approve High-Cost Deployment'
      inputs:
        notifyUsers: 'finance-team@company.com'
        instructions: 'Please review and approve this high-cost Azure deployment'

- stage: Deploy
  displayName: 'Deploy Infrastructure'
  dependsOn: 
  - CostEstimation
  - ManualApproval
  condition: succeeded()
  jobs:
  - job: DeployInfrastructure
    steps:
    - task: AzureResourceManagerTemplateDeployment@3
      inputs:
        deploymentScope: 'Resource Group'
        azureResourceManagerConnection: 'Azure-Connection'
        subscriptionId: '$(subscriptionId)'
        action: 'Create Or Update Resource Group'
        resourceGroupName: '$(resourceGroupName)'
        location: '$(location)'
        templateLocation: 'Linked artifact'
        csmFile: 'infrastructure/main.json'
        csmParametersFile: 'infrastructure/parameters.json'
```

## Conclusion

Azure cost spikes are almost always preventable and fixable, but they require immediate action and systematic investigation. The key is having the right tools and processes in place before the spike happens.

**Emergency Response Summary:**
1. **Stop the bleeding first** - identify and stop expensive resources immediately
2. **Investigate systematically** - use cost analysis tools to find the root cause
3. **Fix the root cause** - don't just treat symptoms
4. **Implement prevention** - set up monitoring and controls to prevent recurrence

**Most Important Prevention Measures:**
- **Daily cost monitoring** with anomaly detection
- **Resource deployment approval workflows** for expensive resources
- **Auto-scaling limits** on all scalable services
- **Development environment auto-shutdown** policies
- **Monthly cost reviews** and optimization sessions

**When to Call for Help:**
- Cost spike exceeds $10,000 and cause is unclear
- Spike involves compliance or security concerns
- Multiple services affected simultaneously
- Recurring spikes despite fixes

Remember: Every cost spike is a learning opportunity. Document what happened, why it happened, and how you fixed it. This documentation will help prevent similar issues in the future and make your response faster when the next spike occurs.

**Need immediate help with a cost spike?** Our emergency response team is available 24/7 to help diagnose and resolve critical Azure cost issues.

**Next Steps:**
- Implement our [automated cost optimization scripts](/blog/automating-azure-cost-optimization)
- Set up [proper enterprise governance](/blog/enterprise-azure-cost-governance)
- Learn about [Azure cost management fundamentals](/blog/azure-cost-management-101)
