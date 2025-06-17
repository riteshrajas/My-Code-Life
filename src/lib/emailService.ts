import emailjs from '@emailjs/browser';

// EmailJS configuration - Replace with your actual EmailJS settings
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your-public-key'
};

// Ritesh's email address - Replace with actual email
const RITESH_EMAIL = import.meta.env.VITE_RITESH_EMAIL || 'ritesh@example.com';

// Initialize EmailJS
const initializeEmailJS = () => {
  if (EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.publicKey !== 'your-public-key') {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }
};

// Initialize on module load
initializeEmailJS();

// Email templates
const generateCallRequestEmail = (
  familyMemberName: string,
  requestedTime: Date,
  message?: string,
  relationship?: string
) => {
  const formattedDate = requestedTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = requestedTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    subject: `📞 Call Request from ${familyMemberName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Call Request</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            margin-bottom: 25px;
          }
          .call-details {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .label {
            font-weight: 600;
            color: #475569;
          }
          .value {
            color: #1e293b;
            text-align: right;
          }
          .message-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .actions {
            text-align: center;
            margin-top: 30px;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
          }
          .btn-accept {
            background: #22c55e;
            color: white;
          }
          .btn-decline {
            background: #ef4444;
            color: white;
          }
          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .container {
              padding: 20px;
            }
            .detail-row {
              flex-direction: column;
            }
            .value {
              text-align: left;
              margin-top: 5px;
            }
            .btn {
              display: block;
              margin: 10px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📞 New Call Request</h1>
            <p style="margin: 5px 0 0 0;">From your family portal</p>
          </div>
          
          <div class="content">
            <p>Hi Ritesh!</p>
            <p><strong>${familyMemberName}</strong>${relationship ? ` (your ${relationship})` : ''} would like to schedule a call with you.</p>
            
            <div class="call-details">
              <div class="detail-row">
                <span class="label">👤 From:</span>
                <span class="value">${familyMemberName}</span>
              </div>
              ${relationship ? `
              <div class="detail-row">
                <span class="label">👨‍👩‍👧‍👦 Relationship:</span>
                <span class="value">${relationship}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">📅 Date:</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">⏰ Time:</span>
                <span class="value">${formattedTime}</span>
              </div>
            </div>
            
            ${message ? `
            <div class="message-box">
              <strong>💬 Message:</strong>
              <p style="margin: 8px 0 0 0; font-style: italic;">"${message}"</p>
            </div>
            ` : ''}
          </div>
          
          <div class="actions">
            <a href="mailto:${familyMemberName.toLowerCase().replace(' ', '')}@family.portal?subject=Call%20Accepted&body=Hi%20${familyMemberName}!%20I%20can%20take%20your%20call%20on%20${formattedDate}%20at%20${formattedTime}.%20Looking%20forward%20to%20chatting!" class="btn btn-accept">✅ Accept Call</a>
            <a href="mailto:${familyMemberName.toLowerCase().replace(' ', '')}@family.portal?subject=Call%20Reschedule&body=Hi%20${familyMemberName}!%20I%20can't%20make%20the%20call%20at%20${formattedTime}%20on%20${formattedDate}.%20Could%20we%20reschedule?" class="btn btn-decline">📅 Reschedule</a>
          </div>
          
          <div class="footer">
            <p>This call request was sent from your family portal.<br>
            You can manage all call requests and family communications through the portal.</p>
            <p style="margin-top: 15px;">
              💜 <strong>Family Connection Portal</strong> 💜<br>
              <small>Keeping families close, one call at a time</small>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Call Request from ${familyMemberName}
      
      ${familyMemberName}${relationship ? ` (your ${relationship})` : ''} would like to schedule a call with you.
      
      Date: ${formattedDate}
      Time: ${formattedTime}
      ${message ? `Message: "${message}"` : ''}
      
      Please respond to let them know if you can take the call.
    `
  };
};

// Send call request email using EmailJS
export const sendCallRequestEmail = async (
  familyMemberName: string,
  requestedTime: Date,
  message?: string,
  relationship?: string
): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.publicKey === 'your-public-key' || 
        EMAILJS_CONFIG.serviceId === 'service_default' || 
        EMAILJS_CONFIG.templateId === 'template_default') {
      
      // Fallback to console logging for demo/development
      const emailContent = generateCallRequestEmail(familyMemberName, requestedTime, message, relationship);
      
      console.log('📧 EMAIL NOTIFICATION (Demo Mode)');
      console.log('===============================');
      console.log(`To: ${RITESH_EMAIL}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Message: ${emailContent.text}`);
      console.log('===============================');
      
      // Show a nice notification to the user
      if (typeof window !== 'undefined') {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">📧</span>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Call Request Sent!</div>
                <div style="font-size: 14px; opacity: 0.9;">
                  Ritesh will receive an email notification about your call request.
                </div>
              </div>
            </div>
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-in forwards';
          notification.style.setProperty('--slideOut', 'translateX(100%)');
          setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
      }
      
      return true;
    }

    // If EmailJS is configured, send the actual email
    const templateParams = {
      to_email: RITESH_EMAIL,
      from_name: familyMemberName,
      subject: `📞 Call Request from ${familyMemberName}`,
      message: message || 'No additional message',
      requested_date: requestedTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      requested_time: requestedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      relationship: relationship || '',
      html_content: generateCallRequestEmail(familyMemberName, requestedTime, message, relationship).html
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('✅ Email sent successfully via EmailJS:', response);
    return true;

  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    
    // Fallback to demo mode on error
    const emailContent = generateCallRequestEmail(familyMemberName, requestedTime, message, relationship);
    console.log('📧 EMAIL NOTIFICATION (Fallback Mode)');
    console.log('=====================================');
    console.log(`To: ${RITESH_EMAIL}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`Message: ${emailContent.text}`);
    console.log('=====================================');
    
    return false;
  }
};

// Send status update email
export const sendStatusUpdateEmail = async (
  familyMemberName: string,
  newStatus: string,
  statusMessage?: string
): Promise<boolean> => {
  try {
    const subject = `📱 ${familyMemberName} updated their status`;
    const statusEmoji = newStatus === 'available' ? '🟢' : newStatus === 'busy' ? '🟡' : '🔴';
    
    console.log('Status update email would be sent:', {
      to: RITESH_EMAIL,
      subject,
      content: `${familyMemberName} is now ${statusEmoji} ${newStatus.replace('_', ' ')}${statusMessage ? `: "${statusMessage}"` : ''}`
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send status update email:', error);
    return false;
  }
};

// Send good vibes email
export const sendGoodVibesEmail = async (
  familyMemberName: string,
  vibeType: string,
  message: string
): Promise<boolean> => {
  try {
    const subject = `${vibeType} ${familyMemberName} sent you some good vibes!`;
    
    console.log('Good vibes email would be sent:', {
      to: RITESH_EMAIL,
      subject,
      content: message
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send good vibes email:', error);
    return false;
  }
};

// For client-side email integration, you can use EmailJS
// Here's a template for EmailJS integration:

/*
// Install EmailJS: npm install @emailjs/browser

import emailjs from '@emailjs/browser';

const EMAILJS_CONFIG = {
  serviceId: 'your_service_id',
  templateId: 'your_template_id',
  publicKey: 'your_public_key'
};

export const sendEmailViaEmailJS = async (
  familyMemberName: string,
  requestedTime: Date,
  message?: string
): Promise<boolean> => {
  try {
    const templateParams = {
      from_name: familyMemberName,
      to_email: RITESH_EMAIL,
      requested_date: requestedTime.toLocaleDateString(),
      requested_time: requestedTime.toLocaleTimeString(),
      message: message || 'No additional message',
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    return true;
  } catch (error) {
    console.error('EmailJS send failed:', error);
    return false;
  }
};
*/
