
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.7";

// SMTP Configuration
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER
const FROM_NAME = Deno.env.get('FROM_NAME') || 'LifePilot'

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

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    if (!SMTP_USER || !SMTP_PASSWORD) {
      throw new Error('SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
    }

    const emailData: EmailData = await req.json()
    
    if (!emailData.to || !emailData.subject) {
      throw new Error('Missing required fields: to, subject');
    }

    console.log('Attempting to send email to:', emailData.to)
    console.log('SMTP Host:', SMTP_HOST)
    console.log('SMTP Port:', SMTP_PORT)
    console.log('From Email:', FROM_EMAIL)    // Create SMTP transporter using nodemailer
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    try {
      // Prepare email data
      const emailOptions: any = {
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: emailData.to,
        subject: emailData.subject,
      };

      // Add content
      if (emailData.text) {
        emailOptions.text = emailData.text;
      }
      if (emailData.html) {
        emailOptions.html = emailData.html;
      }

      // Add attachments if present
      if (emailData.attachments && emailData.attachments.length > 0) {
        emailOptions.attachments = emailData.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          encoding: 'base64',
          contentType: attachment.contentType,
        }));
      }

      console.log('Sending email with options:', JSON.stringify(emailOptions, null, 2));
      
      const info = await transporter.sendMail(emailOptions);
      
      console.log('Email sent successfully:', info.messageId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via SMTP',
        messageId: info.messageId
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (emailError) {
      console.error('SMTP Error:', emailError);
      throw emailError;
    }

  } catch (error) {
    console.error('Error in email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: {
          smtp_user_configured: !!SMTP_USER,
          smtp_password_configured: !!SMTP_PASSWORD,
          smtp_host: SMTP_HOST,
          smtp_port: SMTP_PORT
        }
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
    );
  }
});