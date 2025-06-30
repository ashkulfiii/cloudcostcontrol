// Cloudflare Worker for C³ - Cloud Cost Control Contact Form
// Simple form handler using mimetext for email formatting

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return corsResponse('Method not allowed', 405);
    }

    try {      // Parse form data
      const formData = await request.formData();
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        company: formData.get('company') || 'Not specified',
        monthlySpend: formData.get('monthly-spend') || 'Not specified',
        service: formData.get('service') || 'Not specified',
        urgency: formData.get('urgency') || 'Not specified',
        message: formData.get('message'),
        timestamp: new Date().toISOString(),
        ip: request.headers.get('CF-Connecting-IP')
      };

      // Basic validation
      if (!data.name || !data.email || !data.message) {
        return corsResponse(JSON.stringify({
          success: false,
          error: 'Missing required fields: name, email, and message are required'
        }), 400);
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return corsResponse(JSON.stringify({
          success: false,
          error: 'Invalid email address format'
        }), 400);
      }

      // Honeypot spam protection
      if (formData.get('bot-field')) {
        return corsResponse(JSON.stringify({
          success: false,
          error: 'Spam detected'
        }), 400);
      }

      // Send email notification using Cloudflare Email Workers
      const emailSent = await sendEmailNotification(data, env);
      
      if (!emailSent) {
        console.log('Email binding not configured, form data logged:', data);
      }

      // Return success response
      return corsResponse(JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been received. We\'ll get back to you within 24 hours.'
      }), 200);

    } catch (error) {
      console.error('Form submission error:', error);
      return corsResponse(JSON.stringify({
        success: false,
        error: 'Sorry, there was a problem submitting your form. Please try again or email us directly.'
      }), 500);
    }
  }
};

// Send email notification using mimetext
async function sendEmailNotification(data, env) {
  // Check if email binding is available
  if (!env.SEND_EMAIL) {
    console.log('=== NEW CONTACT FORM SUBMISSION ===');
    console.log(`Name: ${data.name}`);
    console.log(`Email: ${data.email}`);
    console.log(`Company: ${data.company}`);
    console.log(`Monthly Spend: ${data.monthlySpend}`);
    console.log(`Service Interest: ${data.service}`);
    console.log(`Urgency: ${data.urgency}`);
    console.log(`Message: ${data.message}`);
    console.log(`Submitted: ${data.timestamp}`);
    console.log('=====================================');
    return false;
  }

  try {
    // Create MIME message
    const msg = createMimeMessage();
    msg.setSender({ name: "C³ - Cloud Cost Control Website", addr: "noreply@cloudcostcontrol.net" });
    msg.setRecipient("cloudcostcontrol@proton.me");
    msg.setSubject(`${getPriorityTag(data)} New Lead: ${data.name} from ${data.company}`);
    
    // Email body content
    const emailBody = `New C³ - Cloud Cost Control Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Company: ${data.company}
Monthly Azure Spend: ${data.monthlySpend}
Service Interest: ${data.service}
Urgency: ${data.urgency}

Message:
${data.message}

Submitted: ${data.timestamp}
IP: ${data.ip}

---
Priority Level: ${getPriorityLevel(data)}
Suggested Response: ${getResponseSuggestion(data)}

Reply directly to ${data.email} to respond to ${data.name}.`;

    msg.addMessage({
      contentType: 'text/plain',
      data: emailBody
    });

    // Create and send EmailMessage
    const emailMessage = new EmailMessage(
      "noreply@cloudcostcontrol.net",
      "cloudcostcontrol@proton.me",
      msg.asRaw()
    );

    await env.SEND_EMAIL.send(emailMessage);
    
    console.log('Email sent successfully via Cloudflare Email Workers');
    return true;

  } catch (error) {
    console.error('Email send error:', error);
    
    // Fallback: Log to console
    console.log('=== EMAIL SEND FAILED - FORM SUBMISSION ===');
    console.log(`Name: ${data.name}`);
    console.log(`Email: ${data.email}`);
    console.log(`Company: ${data.company}`);
    console.log(`Monthly Spend: ${data.monthlySpend}`);
    console.log(`Service Interest: ${data.service}`);
    console.log(`Urgency: ${data.urgency}`);
    console.log(`Message: ${data.message}`);
    console.log(`Error: ${error.message}`);
    console.log('==========================================');
    
    return false;
  }
}

// Helper function to determine priority level based on form data
function getPriorityLevel(data) {
  if (data.urgency === 'immediate' || data.service === 'emergency-response') {
    return 'HIGH - Emergency Response Needed';
  }
  
  if (data.monthlySpend === 'over-100k' || data.monthlySpend === '50k-100k') {
    return 'HIGH - Enterprise Client';
  }
  
  if (data.urgency === '1-month') {
    return 'MEDIUM - Urgent Timeline';
  }
  
  return 'NORMAL - Standard Timeline';
}

// Helper function to get priority tag for email subject
function getPriorityTag(data) {
  if (data.urgency === 'immediate' || data.service === 'emergency-response') {
    return '[🚨 URGENT]';
  }
  
  if (data.monthlySpend === 'over-100k' || data.monthlySpend === '50k-100k') {
    return '[💎 ENTERPRISE]';
  }
  
  if (data.urgency === '1-month') {
    return '[⚡ PRIORITY]';
  }
  
  return '[📧 LEAD]';
}

// Helper function to suggest response approach
function getResponseSuggestion(data) {
  if (data.urgency === 'immediate') {
    return 'Immediate response required - Call within 2 hours';
  }
  
  if (data.service === 'emergency-response') {
    return 'Emergency service requested - Prioritize rapid response';
  }
  
  if (data.monthlySpend === 'over-100k') {
    return 'Enterprise prospect - Schedule executive consultation';
  }
  
  if (data.urgency === '1-month') {
    return 'Respond within 4 hours - Active buyer signal';
  }
  
  return 'Standard 24-hour response timeline';
}

// Handle CORS preflight
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Create CORS-enabled response
function corsResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
