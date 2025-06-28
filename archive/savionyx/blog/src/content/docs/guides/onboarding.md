---
title: Onboarding Process
date: 2024-12-22
tags: ["onboarding", "azure cost management"]
---

## Onboarding Process

Welcome to Savionyx! To get the most out of our platform and start managing your Azure costs effectively, please follow the onboarding process outlined below. This process ensures that you have access to all the features and tools that Savionyx has to offer.

### Step 1: Enter Your Tenant ID

The first step in the onboarding process is to enter your Azure Tenant ID. This ID is a unique identifier for your Azure account and allows Savionyx to link your Azure resources with our platform.

1. **Locate Your Tenant ID**: You can find your Azure Tenant ID in the Azure portal under the "Azure Active Directory" section.
2. **Enter Your Tenant ID**: In the Savionyx platform, navigate to the onboarding section and enter your Tenant ID in the provided field.
3. **Submit**: Click the "Submit" button to save your Tenant ID.

### Step 2: Grant Access to Cost Data

To provide you with detailed cost analysis and recommendations, Savionyx needs access to your Azure cost data. Follow these steps to grant access:

1. **PowerShell Command**: Open PowerShell and run the following command to assign the "Cost Management Contributor" role to Savionyx:
    ```powershell
    New-AzRoleAssignment -ApplicationId "66666666-6666-6666-6666-666666666666" `
    -RoleDefinitionName "Cost Management Contributor" `
    -Scope "/"
    ```
2. **Azure CLI Command**: Alternatively, you can use the Azure CLI to assign the role:
    ```bash
    az role assignment create --assignee "66666666-6666-6666-6666-666666666666" \
    --role "Cost Management Contributor" \
    --scope "/"
    ```
3. **Verify Access**: After running the command, Savionyx will verify that it has access to your cost data. You will receive a confirmation once access is granted.

### Step 3: Complete the Onboarding Checklist

Savionyx provides an onboarding checklist to ensure that you have completed all necessary steps. The checklist includes:

- **Set Tenant ID**: Confirm that your Tenant ID has been entered and saved.
- **Assign Cost Management Role**: Verify that the "Cost Management Contributor" role has been assigned to Savionyx.
- **View Preliminary Cost Data**: Access your preliminary cost data to ensure that everything is set up correctly.

### Step 4: Start Managing Your Azure Costs

Once you have completed the onboarding process, you can start using Savionyx to manage and optimize your Azure costs. Explore the various features and tools available to gain insights into your spending and make informed decisions to save money.

### Need Help?

If you encounter any issues during the onboarding process or have any questions, our support team is here to help. Please reach out to us for assistance.

Thank you for choosing Savionyx! We are excited to help you take control of your Azure costs.

Happy cost managing!

The Savionyx Team