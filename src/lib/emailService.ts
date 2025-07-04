import supabase from './supabaseClient';

// Email interface for our Supabase Edge Function
interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

// Main email sending function using Supabase Edge Function
export const sendEmail = async (emailData: EmailData) => {
  try {
    // Call Supabase Edge Function for sending emails
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send account deletion email with data backup
export const sendAccountDeletionEmail = async (
  userEmail: string,
  userData: any,
  summary: any
) => {
  const userEmailSubject = `🔐 Your My Life Code Account Data Backup - Safe & Ready for Return`;
  
  const userEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Account Data Backup</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px 20px; 
          border-radius: 10px; 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .content { 
          background: #f8f9fa; 
          padding: 30px; 
          border-radius: 10px; 
          margin-bottom: 20px; 
        }
        .stats { 
          background: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #667eea; 
        }
        .stat-item { 
          display: flex; 
          justify-content: space-between; 
          margin: 10px 0; 
          padding: 8px 0; 
          border-bottom: 1px solid #eee; 
        }
        .restore-steps { 
          background: #e8f5e8; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .restore-steps ol { 
          margin: 10px 0; 
          padding-left: 20px; 
        }
        .restore-steps li { 
          margin: 8px 0; 
        }
        .footer { 
          text-align: center; 
          color: #666; 
          font-size: 14px; 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #eee; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>👋 Your Account Data is Safe!</h1>
        <p>Complete backup ready for your potential return</p>
      </div>

      <div class="content">
        <p>Hi there! 👋</p>
        
        <p>If you're reading this email, it means your <strong>My Life Code</strong> account has been successfully deleted as requested.</p>

        <div class="stats">
          <h3>🛡️ Your Data Backup Summary</h3>
          <div class="stat-item">
            <span>📝 Diary Entries:</span>
            <strong>${summary.total_diary_entries} entries</strong>
          </div>
          <div class="stat-item">
            <span>✅ Tasks:</span>
            <strong>${summary.total_tasks} tasks (${summary.completed_tasks} completed)</strong>
          </div>
          <div class="stat-item">
            <span>👥 Contacts:</span>
            <strong>${summary.total_contacts} contacts</strong>
          </div>
          <div class="stat-item">
            <span>⏰ Account Age:</span>
            <strong>${summary.account_age_days} days</strong>
          </div>
        </div>

        <div class="restore-steps">
          <h3>🚀 Want to Come Back?</h3>
          <p>Life changes, and so do minds! If you ever decide to return to My Life Code:</p>
          <ol>
            <li>Create a new account at <a href="https://mylifecode.vercel.app">mylifecode.vercel.app</a></li>
            <li>Go to <strong>Settings → Data & Privacy → Import Data</strong></li>
            <li>Upload your backup file (attached to this email)</li>
            <li>Everything will be restored exactly as you left it!</li>
          </ol>
        </div>

        <p><strong>📁 Your Backup File:</strong><br>
        File name: <code>stage_data_backup_${userEmail}_${new Date().toISOString().split('T')[0]}.json</code><br>
        This file contains ALL your data in a secure, readable format.</p>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>💝 Thank You</strong></p>
          <p>Thank you for being part of our community. While we're sad to see you go, we respect your decision and hope our paths cross again someday.</p>
          <p><strong>Stay awesome!</strong><br>The My Life Code Team</p>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated message. Your account and all associated data have been permanently deleted from our servers.</p>
        <p>If you have any questions, you can reach us at support@mylifecode.app</p>
      </div>
    </body>
    </html>
  `;

  const userEmailText = `Hi there!

If you're reading this email, it means your My Life Code account has been successfully deleted as requested.

Your Data Backup Summary:
- Diary Entries: ${summary.total_diary_entries} entries
- Tasks: ${summary.total_tasks} tasks (${summary.completed_tasks} completed)
- Contacts: ${summary.total_contacts} contacts  
- Account Age: ${summary.account_age_days} days

Want to Come Back?
Life changes, and so do minds! If you ever decide to return to My Life Code:

1. Create a new account at https://mylifecode.vercel.app
2. Go to Settings → Data & Privacy → Import Data
3. Upload your backup file (attached to this email)
4. Everything will be restored exactly as you left it!

Your Backup File:
File name: stage_data_backup_${userEmail}_${new Date().toISOString().split('T')[0]}.json
This file contains ALL your data in a secure, readable format.

Thank You
Thank you for being part of our community. While we're sad to see you go, we respect your decision and hope our paths cross again someday.

Stay awesome!
The My Life Code Team

---
This is an automated message. Your account and all associated data have been permanently deleted from our servers.`;

  // Create data file attachment
  const dataFileContent = JSON.stringify(userData, null, 2);
  
  try {
    await sendEmail({
      to: userEmail,
      subject: userEmailSubject,
      html: userEmailHtml,
      text: userEmailText,      attachments: [
        {
          filename: `stage_data_backup_${userEmail}_${new Date().toISOString().split('T')[0]}.json`,
          // Use browser-compatible base64 encoding (btoa with UTF-8 handling)
          content: btoa(unescape(encodeURIComponent(dataFileContent))),
          contentType: 'application/json'
        }
      ]
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending account deletion email:', error);
    throw error;
  }
};

// Send developer notification about account deletion
export const sendDeveloperNotification = async (
  userEmail: string,
  userId: string,
  summary: any,
  recentActivity: any
) => {
  const devEmailSubject = `🗂️ Stage App - Account Deletion Notification`;
  
  const devEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .activity { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🗂️ Account Deletion Notification</h2>
        <p><strong>User:</strong> ${userEmail}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Deletion Date:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div class="stats">
        <h3>📊 Account Summary</h3>
        <ul>
          <li>Account Age: ${summary.account_age_days} days</li>
          <li>Total Contacts: ${summary.total_contacts}</li>
          <li>Total Tasks: ${summary.total_tasks}</li>
          <li>Completed Tasks: ${summary.completed_tasks}</li>
          <li>Diary Entries: ${summary.total_diary_entries}</li>
        </ul>
      </div>

      <div class="activity">
        <h3>📋 Recent Activity Summary</h3>
        <p>User has been sent their data backup via email for potential future restoration.</p>
        <p><strong>Recent Diary Entries:</strong></p>
        <ul>
          ${recentActivity.diary?.map((entry: any) => 
            `<li>Diary (${entry.entry_date}): ${entry.content?.substring(0, 100)}...</li>`
          ).join('') || '<li>No recent diary entries</li>'}
        </ul>
        <p><strong>Recent Tasks:</strong></p>
        <ul>
          ${recentActivity.tasks?.map((task: any) => 
            `<li>Task: ${task.title} (${task.status})</li>`
          ).join('') || '<li>No recent tasks</li>'}
        </ul>
      </div>
    </body>
    </html>
  `;

  const devEmailText = `Account Deletion Notification

User: ${userEmail}
User ID: ${userId}
Deletion Date: ${new Date().toLocaleString()}

Account Summary:
- Account Age: ${summary.account_age_days} days
- Total Contacts: ${summary.total_contacts}
- Total Tasks: ${summary.total_tasks}
- Completed Tasks: ${summary.completed_tasks}
- Diary Entries: ${summary.total_diary_entries}

User has been sent their data backup via email for potential future restoration.

Recent Activity Summary:
${recentActivity.diary?.map((entry: any) => `- Diary (${entry.entry_date}): ${entry.content?.substring(0, 100)}...`).join('\n') || 'No recent diary entries'}

${recentActivity.tasks?.map((task: any) => `- Task: ${task.title} (${task.status})`).join('\n') || 'No recent tasks'}`;

  try {
    await sendEmail({
      to: 'code.ritesh+MyCodeLife@gmail.com',
      subject: devEmailSubject,
      html: devEmailHtml,
      text: devEmailText
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending developer notification:', error);
    throw error;
  }
};

// Send call request email (simplified version using SMTP)
export const sendCallRequestEmail = async (
  familyMemberName: string,
  requestedTime: Date,
  message?: string,
  relationship?: string
): Promise<boolean> => {
  try {
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

    const subject = `📞 Call Request from ${familyMemberName}`;
    const htmlContent = `
      <h2>📞 New Call Request</h2>
      <p><strong>${familyMemberName}</strong>${relationship ? ` (your ${relationship})` : ''} would like to schedule a call with you.</p>
      <p><strong>📅 Date:</strong> ${formattedDate}</p>
      <p><strong>⏰ Time:</strong> ${formattedTime}</p>
      ${message ? `<p><strong>💬 Message:</strong> "${message}"</p>` : ''}
    `;

    const textContent = `Call Request from ${familyMemberName}

${familyMemberName}${relationship ? ` (your ${relationship})` : ''} would like to schedule a call with you.

Date: ${formattedDate}
Time: ${formattedTime}
${message ? `Message: "${message}"` : ''}

Please respond to let them know if you can take the call.`;

    await sendEmail({
      to: 'code.ritesh+MyCodeLife@gmail.com',
      subject,
      html: htmlContent,
      text: textContent
    });

    return true;
  } catch (error) {
    console.error('Failed to send call request email:', error);
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
    
    const htmlContent = `
      <h2>📱 Status Update</h2>
      <p>${familyMemberName} is now ${statusEmoji} <strong>${newStatus.replace('_', ' ')}</strong></p>
      ${statusMessage ? `<p><strong>Message:</strong> "${statusMessage}"</p>` : ''}
    `;

    const textContent = `Status Update: ${familyMemberName} is now ${statusEmoji} ${newStatus.replace('_', ' ')}${statusMessage ? `: "${statusMessage}"` : ''}`;

    await sendEmail({
      to: 'code.ritesh+MyCodeLife@gmail.com',
      subject,
      html: htmlContent,
      text: textContent
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
    
    const htmlContent = `
      <h2>${vibeType} Good Vibes from ${familyMemberName}!</h2>
      <p>${message}</p>
    `;

    await sendEmail({
      to: 'code.ritesh+MyCodeLife@gmail.com',
      subject,
      html: htmlContent,
      text: `${subject}\n\n${message}`
    });

    return true;
  } catch (error) {
    console.error('Failed to send good vibes email:', error);
    return false;
  }
};

// Delete user account completely (including auth user)
export const deleteUserAccount = async (userId: string, userEmail: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Use the same URL and key from supabaseClient
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        userId,
        userEmail
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
};
