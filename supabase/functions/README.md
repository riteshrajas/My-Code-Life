# Edge Functions

This directory contains Supabase Edge Functions for the LifePilot app.

## send-email Function

This function handles sending emails using SMTP, including support for attachments.

### Setup

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Deploy the function**:
   ```bash
   supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
   ```

4. **Set Environment Variables**:
   Go to your Supabase dashboard → Settings → Edge Functions and add:
   - `SMTP_HOST`: Your SMTP server hostname (e.g., smtp.gmail.com)
   - `SMTP_PORT`: SMTP port (usually 587 for TLS)
   - `SMTP_USER`: Your email username
   - `SMTP_PASSWORD`: Your email password or app-specific password
   - `FROM_EMAIL`: Email address to send from (optional, defaults to SMTP_USER)
   - `FROM_NAME`: Display name for sender (optional, defaults to "LifePilot")

### Environment Variables Required

- `SMTP_HOST`: SMTP server hostname (e.g., smtp.gmail.com, smtp.outlook.com)
- `SMTP_PORT`: SMTP port number (587 for TLS, 465 for SSL, 25 for non-encrypted)
- `SMTP_USER`: Email username/address for authentication
- `SMTP_PASSWORD`: Email password or app-specific password
- `FROM_EMAIL`: Email address to send from (optional, defaults to SMTP_USER)
- `FROM_NAME`: Display name for the sender (optional, defaults to "LifePilot")

### Usage

The function accepts POST requests with the following JSON payload:

```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "html": "<h1>HTML content</h1>",
  "text": "Plain text content",
  "attachments": [
    {
      "filename": "data.json",
      "content": "base64-encoded-content",
      "contentType": "application/json"
    }
  ]
}
```

### Testing

You can test the function locally using:

```bash
supabase functions serve send-email
```

Then make a POST request to `http://localhost:54321/functions/v1/send-email`

### Deployment

For production deployment:

1. Make sure your Supabase project is set up
2. Run the deployment script: `./scripts/deploy-edge-functions.sh`
3. Configure the SMTP credentials in your Supabase dashboard
4. Test the function with real email addresses

### Security

- The function includes CORS handling for browser requests
- SMTP credentials are stored as environment variables
- TLS encryption is used for SMTP connections
- Input validation is performed on required fields
