---
title: "Multi-Cloud Cost Management: Azure, AWS, and GCP Strategy"
description: "Master multi-cloud cost optimization across Azure, AWS, and GCP with unified monitoring, cross-cloud arbitrage, and strategic resource placement."
pubDate: 2025-03-01
hero: "/blog-placeholder-1.jpg"
tags: ["multi-cloud", "cost-optimization", "azure", "aws", "gcp", "cloud-strategy"]
---

# Multi-Cloud Cost Management: Azure, AWS, and GCP Strategy

Managing costs across multiple cloud providers presents unique challenges and opportunities. This comprehensive guide shows you how to optimize costs across Azure, AWS, and GCP through strategic resource placement, unified monitoring, and cross-cloud arbitrage.

## Multi-Cloud Cost Landscape

### Why Organizations Go Multi-Cloud
- **Risk Mitigation**: Avoid vendor lock-in
- **Best-of-Breed Services**: Use each cloud's strengths
- **Regulatory Compliance**: Meet data residency requirements
- **Cost Optimization**: Leverage pricing differences
- **Business Continuity**: Ensure high availability

### Common Multi-Cloud Cost Challenges
- **Complexity**: Different pricing models and tools
- **Visibility**: Fragmented cost monitoring
- **Data Transfer**: Cross-cloud egress charges
- **Resource Sprawl**: Duplicate services across clouds
- **Skill Requirements**: Multiple platform expertise

## Unified Cost Monitoring Strategy

### Cross-Cloud Cost Dashboard

```python
# multi_cloud_cost_monitor.py
import boto3
import json
from azure.identity import DefaultAzureCredential
from azure.mgmt.consumption import ConsumptionManagementClient
from google.cloud import billing
from datetime import datetime, timedelta
import pandas as pd

class MultiCloudCostMonitor:
    def __init__(self, config):
        self.config = config
        self.setup_clients()
    
    def setup_clients(self):
        # AWS
        self.aws_ce = boto3.client('ce', region_name='us-east-1')
        
        # Azure
        credential = DefaultAzureCredential()
        self.azure_consumption = ConsumptionManagementClient(
            credential, self.config['azure']['subscription_id']
        )
        
        # GCP
        self.gcp_billing = billing.CloudBillingClient()
    
    def get_aws_costs(self, start_date, end_date):
        """Get AWS costs for specified period"""
        response = self.aws_ce.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'},
                {'Type': 'DIMENSION', 'Key': 'REGION'}
            ]
        )
        
        costs = []
        for result in response['ResultsByTime']:
            date = result['TimePeriod']['Start']
            for group in result['Groups']:
                service = group['Keys'][0]
                region = group['Keys'][1]
                amount = float(group['Metrics']['BlendedCost']['Amount'])
                
                costs.append({
                    'provider': 'AWS',
                    'date': date,
                    'service': service,
                    'region': region,
                    'cost': amount
                })
        
        return costs
    
    def get_azure_costs(self, start_date, end_date):
        """Get Azure costs for specified period"""
        scope = f"/subscriptions/{self.config['azure']['subscription_id']}"
        
        usage_details = self.azure_consumption.usage_details.list(
            scope=scope,
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d')
        )
        
        costs = []
        for usage in usage_details:
            costs.append({
                'provider': 'Azure',
                'date': usage.date.strftime('%Y-%m-%d'),
                'service': usage.meter_category,
                'region': usage.resource_location,
                'cost': usage.cost
            })
        
        return costs
    
    def get_gcp_costs(self, start_date, end_date):
        """Get GCP costs for specified period"""
        project_id = self.config['gcp']['project_id']
        
        # Using BigQuery to query billing export
        from google.cloud import bigquery
        
        client = bigquery.Client(project=project_id)
        
        query = f"""
        SELECT 
            'GCP' as provider,
            DATE(usage_start_time) as date,
            service.description as service,
            location.region as region,
            SUM(cost) as cost
        FROM `{project_id}.billing.gcp_billing_export_v1_{self.config['gcp']['billing_table']}`
        WHERE DATE(usage_start_time) BETWEEN '{start_date.strftime('%Y-%m-%d')}' 
              AND '{end_date.strftime('%Y-%m-%d')}'
        GROUP BY date, service, region
        ORDER BY date, cost DESC
        """
        
        query_job = client.query(query)
        results = query_job.result()
        
        costs = []
        for row in results:
            costs.append({
                'provider': row.provider,
                'date': row.date.strftime('%Y-%m-%d'),
                'service': row.service,
                'region': row.region,
                'cost': float(row.cost)
            })
        
        return costs
    
    def generate_unified_report(self, days_back=30):
        """Generate unified cost report across all clouds"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Collect costs from all providers
        all_costs = []
        all_costs.extend(self.get_aws_costs(start_date, end_date))
        all_costs.extend(self.get_azure_costs(start_date, end_date))
        all_costs.extend(self.get_gcp_costs(start_date, end_date))
        
        # Create DataFrame for analysis
        df = pd.DataFrame(all_costs)
        
        # Generate summary statistics
        summary = {
            'total_cost': df['cost'].sum(),
            'cost_by_provider': df.groupby('provider')['cost'].sum().to_dict(),
            'cost_by_service': df.groupby('service')['cost'].sum().nlargest(10).to_dict(),
            'cost_by_region': df.groupby('region')['cost'].sum().nlargest(10).to_dict(),
            'daily_trend': df.groupby('date')['cost'].sum().to_dict()
        }
        
        return summary, df
    
    def identify_optimization_opportunities(self, df):
        """Identify cost optimization opportunities across clouds"""
        opportunities = []
        
        # 1. Service price comparison
        service_mapping = {
            'EC2-Instance': ['Virtual Machines', 'Compute Engine'],
            'AmazonS3': ['Blob Storage', 'Cloud Storage'],
            'AmazonRDS': ['SQL Database', 'Cloud SQL']
        }
        
        for aws_service, equivalent_services in service_mapping.items():
            aws_cost = df[
                (df['provider'] == 'AWS') & 
                (df['service'] == aws_service)
            ]['cost'].sum()
            
            azure_cost = df[
                (df['provider'] == 'Azure') & 
                (df['service'].isin(equivalent_services))
            ]['cost'].sum()
            
            gcp_cost = df[
                (df['provider'] == 'GCP') & 
                (df['service'].isin(equivalent_services))
            ]['cost'].sum()
            
            if aws_cost > 0 and azure_cost > 0 and gcp_cost > 0:
                costs = {'AWS': aws_cost, 'Azure': azure_cost, 'GCP': gcp_cost}
                cheapest = min(costs, key=costs.get)
                most_expensive = max(costs, key=costs.get)
                
                if costs[most_expensive] > costs[cheapest] * 1.2:  # 20% difference
                    opportunities.append({
                        'type': 'Service Migration',
                        'service': aws_service,
                        'from_provider': most_expensive,
                        'to_provider': cheapest,
                        'potential_savings': costs[most_expensive] - costs[cheapest],
                        'description': f'Migrate {aws_service} from {most_expensive} to {cheapest}'
                    })
        
        # 2. Regional arbitrage opportunities
        regional_costs = df.groupby(['provider', 'region'])['cost'].sum().reset_index()
        
        for provider in ['AWS', 'Azure', 'GCP']:
            provider_costs = regional_costs[regional_costs['provider'] == provider]
            if len(provider_costs) > 1:
                cheapest_region = provider_costs.loc[provider_costs['cost'].idxmin()]
                most_expensive_region = provider_costs.loc[provider_costs['cost'].idxmax()]
                
                if most_expensive_region['cost'] > cheapest_region['cost'] * 1.3:
                    opportunities.append({
                        'type': 'Regional Migration',
                        'provider': provider,
                        'from_region': most_expensive_region['region'],
                        'to_region': cheapest_region['region'],
                        'potential_savings': most_expensive_region['cost'] - cheapest_region['cost'],
                        'description': f'Move {provider} resources from {most_expensive_region["region"]} to {cheapest_region["region"]}'
                    })
        
        return opportunities

# Usage
config = {
    'azure': {'subscription_id': 'your-azure-subscription-id'},
    'gcp': {
        'project_id': 'your-gcp-project-id',
        'billing_table': 'your-billing-table-suffix'
    }
}

monitor = MultiCloudCostMonitor(config)
summary, df = monitor.generate_unified_report(30)
opportunities = monitor.identify_optimization_opportunities(df)

print(f"Total Multi-Cloud Cost: ${summary['total_cost']:.2f}")
print("\nCost by Provider:")
for provider, cost in summary['cost_by_provider'].items():
    print(f"  {provider}: ${cost:.2f}")

print(f"\nOptimization Opportunities ({len(opportunities)} found):")
for opp in opportunities[:5]:  # Show top 5
    print(f"  {opp['type']}: {opp['description']} - Save ${opp['potential_savings']:.2f}")
```

### Automated Cost Alerting

```yaml
# multi-cloud-alerts.yml
trigger: none

schedules:
- cron: "0 9 * * *"  # Daily at 9 AM
  displayName: 'Daily Multi-Cloud Cost Check'
  branches:
    include:
    - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: multi-cloud-credentials
  - name: CostThreshold
    value: 1000  # Daily cost threshold in USD

steps:
- task: UsePythonVersion@0
  inputs:
    versionSpec: '3.9'

- script: |
    pip install boto3 azure-identity azure-mgmt-consumption google-cloud-billing pandas
  displayName: 'Install Dependencies'

- task: PythonScript@0
  displayName: 'Check Multi-Cloud Costs'
  inputs:
    scriptSource: 'inline'
    script: |
      import os
      import json
      from multi_cloud_cost_monitor import MultiCloudCostMonitor
      
      # Initialize monitor
      config = {
          'azure': {'subscription_id': os.environ['AZURE_SUBSCRIPTION_ID']},
          'gcp': {
              'project_id': os.environ['GCP_PROJECT_ID'],
              'billing_table': os.environ['GCP_BILLING_TABLE']
          }
      }
      
      monitor = MultiCloudCostMonitor(config)
      summary, df = monitor.generate_unified_report(1)  # Yesterday's costs
      
      # Check if costs exceed threshold
      daily_cost = summary['total_cost']
      threshold = float(os.environ['COST_THRESHOLD'])
      
      if daily_cost > threshold:
          print(f"##vso[task.logissue type=warning]Daily cost ${daily_cost:.2f} exceeds threshold ${threshold:.2f}")
          
          # Send detailed breakdown
          print("Cost breakdown by provider:")
          for provider, cost in summary['cost_by_provider'].items():
              print(f"  {provider}: ${cost:.2f}")
          
          # Identify immediate opportunities
          opportunities = monitor.identify_optimization_opportunities(df)
          if opportunities:
              print(f"\nImmediate optimization opportunities:")
              for opp in opportunities[:3]:
                  print(f"  {opp['description']} - Save ${opp['potential_savings']:.2f}")
      else:
          print(f"Daily cost ${daily_cost:.2f} is within threshold ${threshold:.2f}")
  env:
    AZURE_SUBSCRIPTION_ID: $(AZURE_SUBSCRIPTION_ID)
    GCP_PROJECT_ID: $(GCP_PROJECT_ID)
    GCP_BILLING_TABLE: $(GCP_BILLING_TABLE)
    COST_THRESHOLD: $(CostThreshold)
```

## Cross-Cloud Arbitrage Strategies

### Workload Placement Optimization

```python
# workload_placement_optimizer.py
import requests
import json
from datetime import datetime, timedelta

class WorkloadPlacementOptimizer:
    def __init__(self):
        self.pricing_data = self.load_pricing_data()
    
    def load_pricing_data(self):
        """Load current pricing data for all clouds"""
        # This would typically come from pricing APIs or cached data
        return {
            'compute': {
                'AWS': {
                    'us-east-1': {'Standard_D2s_v3': 0.096, 'Standard_D4s_v3': 0.192},
                    'us-west-2': {'Standard_D2s_v3': 0.096, 'Standard_D4s_v3': 0.192},
                    'eu-west-1': {'Standard_D2s_v3': 0.105, 'Standard_D4s_v3': 0.211}
                },
                'Azure': {
                    'East US': {'Standard_D2s_v3': 0.096, 'Standard_D4s_v3': 0.192},
                    'West US 2': {'Standard_D2s_v3': 0.096, 'Standard_D4s_v3': 0.192},
                    'West Europe': {'Standard_D2s_v3': 0.108, 'Standard_D4s_v3': 0.216}
                },
                'GCP': {
                    'us-central1': {'n1-standard-2': 0.095, 'n1-standard-4': 0.190},
                    'us-west1': {'n1-standard-2': 0.095, 'n1-standard-4': 0.190},
                    'europe-west1': {'n1-standard-2': 0.104, 'n1-standard-4': 0.208}
                }
            },
            'storage': {
                'AWS': {
                    'us-east-1': {'Standard': 0.023, 'IA': 0.0125, 'Glacier': 0.004},
                    'eu-west-1': {'Standard': 0.024, 'IA': 0.013, 'Glacier': 0.0045}
                },
                'Azure': {
                    'East US': {'Hot': 0.0184, 'Cool': 0.01, 'Archive': 0.002},
                    'West Europe': {'Hot': 0.0198, 'Cool': 0.0108, 'Archive': 0.0022}
                },
                'GCP': {
                    'us-central1': {'Standard': 0.020, 'Nearline': 0.010, 'Coldline': 0.004},
                    'europe-west1': {'Standard': 0.023, 'Nearline': 0.013, 'Coldline': 0.0045}
                }
            }
        }
    
    def find_optimal_placement(self, workload_requirements):
        """Find the most cost-effective placement for a workload"""
        best_options = []
        
        for service_type, requirements in workload_requirements.items():
            service_options = []
            
            if service_type in self.pricing_data:
                for provider, regions in self.pricing_data[service_type].items():
                    for region, pricing in regions.items():
                        for instance_type, hourly_cost in pricing.items():
                            if self.meets_requirements(instance_type, requirements):
                                monthly_cost = hourly_cost * 24 * 30
                                service_options.append({
                                    'provider': provider,
                                    'region': region,
                                    'instance_type': instance_type,
                                    'hourly_cost': hourly_cost,
                                    'monthly_cost': monthly_cost,
                                    'service_type': service_type
                                })
            
            # Sort by cost and add to best options
            service_options.sort(key=lambda x: x['monthly_cost'])
            best_options.extend(service_options[:3])  # Top 3 for each service
        
        return best_options
    
    def meets_requirements(self, instance_type, requirements):
        """Check if instance type meets workload requirements"""
        # Simplified requirements checking
        instance_specs = {
            'Standard_D2s_v3': {'cpu': 2, 'memory': 8, 'network': 'moderate'},
            'Standard_D4s_v3': {'cpu': 4, 'memory': 16, 'network': 'high'},
            'n1-standard-2': {'cpu': 2, 'memory': 7.5, 'network': 'moderate'},
            'n1-standard-4': {'cpu': 4, 'memory': 15, 'network': 'high'}
        }
        
        if instance_type not in instance_specs:
            return False
        
        specs = instance_specs[instance_type]
        
        return (specs['cpu'] >= requirements.get('min_cpu', 1) and
                specs['memory'] >= requirements.get('min_memory', 4) and
                specs['network'] in requirements.get('network_tiers', ['moderate', 'high']))
    
    def calculate_migration_cost(self, from_config, to_config, data_size_gb=0):
        """Calculate the cost of migrating workloads between clouds"""
        # Data transfer costs (simplified)
        egress_costs = {
            'AWS': 0.09,  # per GB
            'Azure': 0.087,
            'GCP': 0.12
        }
        
        # Migration effort cost (simplified)
        migration_effort_hours = {
            ('AWS', 'Azure'): 40,
            ('AWS', 'GCP'): 50,
            ('Azure', 'GCP'): 45,
            ('Azure', 'AWS'): 40,
            ('GCP', 'AWS'): 50,
            ('GCP', 'Azure'): 45
        }
        
        from_provider = from_config['provider']
        to_provider = to_config['provider']
        
        # Data transfer cost
        transfer_cost = data_size_gb * egress_costs.get(from_provider, 0.1)
        
        # Migration effort cost (assuming $100/hour for engineering)
        effort_key = (from_provider, to_provider)
        effort_cost = migration_effort_hours.get(effort_key, 60) * 100
        
        # Downtime cost (simplified)
        downtime_cost = 1000  # Fixed downtime cost
        
        return {
            'transfer_cost': transfer_cost,
            'effort_cost': effort_cost,
            'downtime_cost': downtime_cost,
            'total_migration_cost': transfer_cost + effort_cost + downtime_cost
        }
    
    def recommend_migrations(self, current_workloads):
        """Recommend workload migrations for cost optimization"""
        recommendations = []
        
        for workload in current_workloads:
            # Find optimal placement
            requirements = workload['requirements']
            optimal_options = self.find_optimal_placement({workload['type']: requirements})
            
            if not optimal_options:
                continue
            
            current_cost = workload['monthly_cost']
            best_option = optimal_options[0]
            
            # Calculate migration cost
            migration_costs = self.calculate_migration_cost(
                workload, best_option, workload.get('data_size_gb', 100)
            )
            
            # Calculate payback period
            monthly_savings = current_cost - best_option['monthly_cost']
            if monthly_savings > 0:
                payback_months = migration_costs['total_migration_cost'] / monthly_savings
                
                recommendations.append({
                    'workload_name': workload['name'],
                    'current_provider': workload['provider'],
                    'current_cost': current_cost,
                    'recommended_provider': best_option['provider'],
                    'recommended_region': best_option['region'],
                    'recommended_cost': best_option['monthly_cost'],
                    'monthly_savings': monthly_savings,
                    'migration_cost': migration_costs['total_migration_cost'],
                    'payback_months': payback_months,
                    'annual_savings': monthly_savings * 12,
                    'priority': 'High' if payback_months < 6 else 'Medium' if payback_months < 12 else 'Low'
                })
        
        # Sort by annual savings potential
        recommendations.sort(key=lambda x: x['annual_savings'], reverse=True)
        return recommendations

# Example usage
optimizer = WorkloadPlacementOptimizer()

# Define current workloads
current_workloads = [
    {
        'name': 'Web Application',
        'provider': 'Azure',
        'region': 'West Europe',
        'type': 'compute',
        'monthly_cost': 250,
        'requirements': {'min_cpu': 2, 'min_memory': 8, 'network_tiers': ['moderate']},
        'data_size_gb': 50
    },
    {
        'name': 'Database Server',
        'provider': 'AWS',
        'region': 'eu-west-1',
        'type': 'compute',
        'monthly_cost': 400,
        'requirements': {'min_cpu': 4, 'min_memory': 16, 'network_tiers': ['high']},
        'data_size_gb': 200
    }
]

recommendations = optimizer.recommend_migrations(current_workloads)

print("Migration Recommendations:")
print("=" * 50)
for rec in recommendations:
    print(f"Workload: {rec['workload_name']}")
    print(f"  Current: {rec['current_provider']} - ${rec['current_cost']:.2f}/month")
    print(f"  Recommended: {rec['recommended_provider']} ({rec['recommended_region']}) - ${rec['recommended_cost']:.2f}/month")
    print(f"  Monthly Savings: ${rec['monthly_savings']:.2f}")
    print(f"  Migration Cost: ${rec['migration_cost']:.2f}")
    print(f"  Payback Period: {rec['payback_months']:.1f} months")
    print(f"  Priority: {rec['priority']}")
    print()
```

## Service-Specific Multi-Cloud Strategies

### Compute Optimization

```bash
#!/bin/bash
# multi-cloud-compute-optimizer.sh

# Function to get AWS EC2 pricing
get_aws_pricing() {
    local instance_type=$1
    local region=$2
    
    aws pricing get-products \
        --service-code AmazonEC2 \
        --filters "Type=TERM_MATCH,Field=instanceType,Value=$instance_type" \
                  "Type=TERM_MATCH,Field=location,Value=$region" \
                  "Type=TERM_MATCH,Field=tenancy,Value=Shared" \
                  "Type=TERM_MATCH,Field=operatingSystem,Value=Linux" \
        --format-version aws_v1 \
        --query 'PriceList[0]' | jq -r '.terms.OnDemand | to_entries[0].value.priceDimensions | to_entries[0].value.pricePerUnit.USD'
}

# Function to get Azure VM pricing
get_azure_pricing() {
    local vm_size=$1
    local region=$2
    
    az vm list-sizes --location "$region" --query "[?name=='$vm_size'].{Name:name}" -o tsv >/dev/null
    if [ $? -eq 0 ]; then
        # Use Azure Retail Prices API
        curl -s "https://prices.azure.com/api/retail-prices?api-version=2023-01-01-preview&\$filter=serviceName eq 'Virtual Machines' and armSkuName eq '$vm_size' and armRegionName eq '$region'" \
            | jq -r '.Items[0].unitPrice'
    fi
}

# Function to compare compute costs
compare_compute_costs() {
    local workload_name=$1
    local cpu_cores=$2
    local memory_gb=$3
    
    echo "Comparing costs for: $workload_name (CPU: $cpu_cores cores, Memory: ${memory_gb}GB)"
    echo "================================================================"
    
    # AWS options
    echo "AWS Options:"
    for region in "us-east-1" "us-west-2" "eu-west-1"; do
        if [ $cpu_cores -le 2 ]; then
            instance_type="t3.medium"
        elif [ $cpu_cores -le 4 ]; then
            instance_type="t3.large"
        else
            instance_type="t3.xlarge"
        fi
        
        price=$(get_aws_pricing $instance_type $region)
        monthly_cost=$(echo "$price * 24 * 30" | bc -l)
        echo "  $region: $instance_type - \$${monthly_cost}/month"
    done
    
    # Azure options
    echo "Azure Options:"
    for region in "eastus" "westus2" "westeurope"; do
        if [ $cpu_cores -le 2 ]; then
            vm_size="Standard_B2s"
        elif [ $cpu_cores -le 4 ]; then
            vm_size="Standard_B4ms"
        else
            vm_size="Standard_D4s_v3"
        fi
        
        price=$(get_azure_pricing $vm_size $region)
        if [ ! -z "$price" ]; then
            monthly_cost=$(echo "$price * 24 * 30" | bc -l)
            echo "  $region: $vm_size - \$${monthly_cost}/month"
        fi
    done
    
    echo ""
}

# Example usage
compare_compute_costs "Web Server" 2 8
compare_compute_costs "Application Server" 4 16
```

### Storage Optimization

```python
# multi_cloud_storage_optimizer.py
import boto3
from azure.storage.blob import BlobServiceClient
from google.cloud import storage
import json

class MultiCloudStorageOptimizer:
    def __init__(self, config):
        self.config = config
        self.setup_clients()
    
    def setup_clients(self):
        # AWS S3
        self.s3_client = boto3.client('s3')
        
        # Azure Blob Storage
        self.azure_blob_client = BlobServiceClient.from_connection_string(
            self.config['azure']['connection_string']
        )
        
        # Google Cloud Storage
        self.gcs_client = storage.Client(project=self.config['gcp']['project_id'])
    
    def analyze_storage_patterns(self):
        """Analyze storage access patterns across all clouds"""
        patterns = {
            'aws': self.analyze_s3_patterns(),
            'azure': self.analyze_azure_patterns(),
            'gcp': self.analyze_gcs_patterns()
        }
        return patterns
    
    def analyze_s3_patterns(self):
        """Analyze S3 bucket patterns"""
        patterns = {}
        
        # List all buckets
        buckets = self.s3_client.list_buckets()['Buckets']
        
        for bucket in buckets:
            bucket_name = bucket['Name']
            
            # Get bucket statistics
            try:
                objects = self.s3_client.list_objects_v2(Bucket=bucket_name)
                
                if 'Contents' in objects:
                    total_size = sum(obj['Size'] for obj in objects['Contents'])
                    object_count = len(objects['Contents'])
                    
                    # Analyze access patterns (simplified)
                    hot_objects = sum(1 for obj in objects['Contents'] 
                                    if (datetime.now() - obj['LastModified']).days <= 30)
                    cool_objects = object_count - hot_objects
                    
                    patterns[bucket_name] = {
                        'total_size_gb': total_size / (1024**3),
                        'object_count': object_count,
                        'hot_objects': hot_objects,
                        'cool_objects': cool_objects,
                        'current_class': self.get_s3_storage_class(bucket_name)
                    }
            except Exception as e:
                print(f"Error analyzing bucket {bucket_name}: {e}")
        
        return patterns
    
    def calculate_optimal_storage_distribution(self, patterns):
        """Calculate optimal storage distribution across clouds"""
        recommendations = []
        
        # Pricing data (simplified)
        storage_prices = {
            'aws': {
                'standard': 0.023,
                'ia': 0.0125,
                'glacier': 0.004
            },
            'azure': {
                'hot': 0.0184,
                'cool': 0.01,
                'archive': 0.002
            },
            'gcp': {
                'standard': 0.020,
                'nearline': 0.010,
                'coldline': 0.004
            }
        }
        
        for provider, provider_patterns in patterns.items():
            for resource_name, pattern in provider_patterns.items():
                size_gb = pattern['total_size_gb']
                hot_ratio = pattern['hot_objects'] / pattern['object_count'] if pattern['object_count'] > 0 else 0
                
                # Calculate current cost
                current_tier = self.map_storage_tier(pattern.get('current_class', 'standard'), provider)
                current_cost = size_gb * storage_prices[provider][current_tier]
                
                # Find optimal placement
                best_cost = float('inf')
                best_option = None
                
                for target_provider, tiers in storage_prices.items():
                    for tier, price in tiers.items():
                        # Simple logic: hot data goes to standard/hot, cold data to archive tiers
                        if hot_ratio > 0.5 and tier in ['standard', 'hot']:
                            cost = size_gb * price
                        elif hot_ratio <= 0.5 and tier in ['ia', 'cool', 'nearline', 'glacier', 'archive', 'coldline']:
                            cost = size_gb * price
                        else:
                            continue
                        
                        if cost < best_cost:
                            best_cost = cost
                            best_option = (target_provider, tier)
                
                if best_option and best_cost < current_cost:
                    savings = current_cost - best_cost
                    recommendations.append({
                        'resource': resource_name,
                        'current_provider': provider,
                        'current_tier': current_tier,
                        'current_cost': current_cost,
                        'recommended_provider': best_option[0],
                        'recommended_tier': best_option[1],
                        'recommended_cost': best_cost,
                        'monthly_savings': savings,
                        'size_gb': size_gb,
                        'hot_ratio': hot_ratio
                    })
        
        return sorted(recommendations, key=lambda x: x['monthly_savings'], reverse=True)
    
    def map_storage_tier(self, tier, provider):
        """Map provider-specific tier names to standardized names"""
        tier_mapping = {
            'aws': {
                'STANDARD': 'standard',
                'STANDARD_IA': 'ia',
                'GLACIER': 'glacier'
            },
            'azure': {
                'Hot': 'hot',
                'Cool': 'cool',
                'Archive': 'archive'
            },
            'gcp': {
                'STANDARD': 'standard',
                'NEARLINE': 'nearline',
                'COLDLINE': 'coldline'
            }
        }
        
        return tier_mapping.get(provider, {}).get(tier, 'standard')
    
    def get_s3_storage_class(self, bucket_name):
        """Get the primary storage class for an S3 bucket"""
        try:
            lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            # Simplified - return the first rule's storage class
            if 'Rules' in lifecycle and lifecycle['Rules']:
                transitions = lifecycle['Rules'][0].get('Transitions', [])
                if transitions:
                    return transitions[0]['StorageClass']
        except:
            pass
        
        return 'STANDARD'  # Default

# Usage example
config = {
    'azure': {'connection_string': 'your-azure-connection-string'},
    'gcp': {'project_id': 'your-gcp-project-id'}
}

optimizer = MultiCloudStorageOptimizer(config)
patterns = optimizer.analyze_storage_patterns()
recommendations = optimizer.calculate_optimal_storage_distribution(patterns)

print("Storage Optimization Recommendations:")
print("=" * 50)
for rec in recommendations[:10]:  # Top 10 recommendations
    print(f"Resource: {rec['resource']}")
    print(f"  Current: {rec['current_provider']} {rec['current_tier']} - ${rec['current_cost']:.2f}/month")
    print(f"  Recommended: {rec['recommended_provider']} {rec['recommended_tier']} - ${rec['recommended_cost']:.2f}/month")
    print(f"  Monthly Savings: ${rec['monthly_savings']:.2f}")
    print(f"  Size: {rec['size_gb']:.1f} GB")
    print()
```

## Implementation Strategy

### Phase 1: Assessment and Planning (Weeks 1-4)
1. **Inventory Current Resources**: Catalog all cloud resources
2. **Cost Baseline**: Establish current spending across all clouds
3. **Usage Analysis**: Understand access patterns and requirements
4. **Compliance Mapping**: Document regulatory and compliance requirements

### Phase 2: Quick Wins (Weeks 5-8)
1. **Unified Monitoring**: Implement cross-cloud cost dashboards
2. **Automated Alerts**: Set up cost anomaly detection
3. **Low-Risk Migrations**: Move development/test workloads
4. **Storage Optimization**: Implement lifecycle policies

### Phase 3: Strategic Optimization (Weeks 9-16)
1. **Workload Analysis**: Deep dive into compute requirements
2. **Cross-Cloud Arbitrage**: Implement automated workload placement
3. **Reserved Capacity**: Optimize long-term commitments
4. **Advanced Automation**: Deploy infrastructure as code

### Phase 4: Continuous Optimization (Ongoing)
1. **Regular Reviews**: Monthly cost optimization meetings
2. **Market Monitoring**: Track pricing changes across clouds
3. **Performance Tuning**: Optimize for cost-performance ratio
4. **Innovation Adoption**: Leverage new cost-effective services

## Real-World Case Study

**Challenge**: A global e-commerce company with infrastructure across AWS, Azure, and GCP spending $50,000/month with 30% waste.

**Multi-Cloud Optimization Strategy**:
1. **Unified Monitoring**: Implemented cross-cloud cost dashboard
   - **Impact**: 100% visibility into spending patterns

2. **Workload Redistribution**: 
   - Moved compute-intensive AI workloads to GCP (better GPU pricing)
   - Migrated storage to AWS S3 (better lifecycle management)
   - Kept core applications on Azure (existing expertise)
   - **Impact**: 25% cost reduction

3. **Cross-Cloud Arbitrage**:
   - Automated spot instance usage across all clouds
   - Implemented dynamic scaling based on regional pricing
   - **Impact**: 15% additional reduction

4. **Storage Optimization**:
   - Implemented intelligent tiering across all platforms
   - Consolidated duplicate data
   - **Impact**: 20% storage cost reduction

**Total Result**: Monthly costs reduced from $50,000 to $28,000 (44% reduction) while improving global performance and reliability.

## Key Success Factors

1. **Unified Visibility**: Implement comprehensive monitoring across all clouds
2. **Automation First**: Automate decision-making and resource management
3. **Continuous Optimization**: Regular review and adjustment of strategies
4. **Skills Investment**: Train teams on multi-cloud cost management
5. **Governance Framework**: Establish clear policies and procedures

## Tools and Resources

### Recommended Tools
- **Cloud Cost Management**: CloudHealth, Cloudability, Spot.io
- **Infrastructure as Code**: Terraform, Pulumi
- **Monitoring**: Prometheus, Grafana, Custom dashboards
- **Automation**: Cloud-native tools (AWS Cost Explorer, Azure Cost Management, GCP Cost Management)

### Best Practices Checklist
- [ ] Implement unified cost monitoring
- [ ] Set up automated alerting
- [ ] Regular workload placement reviews
- [ ] Cross-cloud pricing comparison
- [ ] Data transfer optimization
- [ ] Reserved capacity optimization
- [ ] Governance and tagging standards
- [ ] Team training and skills development

Multi-cloud cost optimization is complex but rewarding. The key is to start with visibility, implement gradual changes, and continuously optimize based on actual usage patterns and cost data. The potential savings of 30-50% make this effort worthwhile for most organizations.
