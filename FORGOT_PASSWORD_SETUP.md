# Forgot Password Functionality Setup

This document explains how to set up and use the forgot password functionality in the TiNHiH Portal.

## Overview

The forgot password functionality allows users to reset their passwords via email. The system includes:

1. **Forgot Password Form**: Users can request a password reset by entering their email
2. **Email Notification**: A secure reset link is sent to the user's email
3. **Password Reset Page**: Users can set a new password using the reset link
4. **Security Features**: Tokens expire after 1 hour and are single-use

## Setup Instructions

### 1. Database Migration

First, run the database migration to add the required fields:

```sql
-- Add reset token fields to users table
ALTER TABLE users 
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expiry TIMESTAMP;
```

You can run this SQL directly in your database or use the provided migration file:
`server/add-reset-token-fields.sql`

### 2. Email Configuration

Update your `.env` file with the following email settings:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@tinhih.org
CLIENT_BASE_URL=http://localhost:5173
```

**For Gmail Setup:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the generated password as `SMTP_PASS`

### 3. Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# Required for password reset functionality
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@tinhih.org
CLIENT_BASE_URL=http://localhost:5173
```

## How It Works

### 1. User Requests Password Reset

1. User clicks "Forgot Password" tab on the login page
2. User enters their email address
3. System validates the email and sends a reset link

### 2. Email Delivery

The system sends a professionally formatted email containing:
- TiNHiH Foundation branding
- Personalized greeting with user's first name
- Clear instructions
- Secure reset link (expires in 1 hour)
- Fallback text link

### 3. Password Reset Process

1. User clicks the reset link in their email
2. User is taken to the reset password page
3. User enters and confirms their new password
4. System validates password strength requirements
5. Password is updated and user is redirected to login

## Security Features

- **Token Expiration**: Reset tokens expire after 1 hour
- **Single Use**: Tokens are invalidated after use
- **Secure Generation**: Tokens are cryptographically secure
- **No User Enumeration**: System doesn't reveal if an email exists
- **Password Strength**: Enforces strong password requirements

## API Endpoints

### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
Reset password using token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "new-secure-password"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

## Frontend Components

### Login Page Updates
- Added "Forgot Password" tab
- Integrated forgot password form
- Success/error message handling

### Reset Password Page
- New page at `/reset-password`
- Password strength indicator
- Form validation
- Success/error handling

## Testing

### Test the Complete Flow

1. **Request Reset:**
   - Go to login page
   - Click "Forgot Password" tab
   - Enter a valid email
   - Submit the form

2. **Check Email:**
   - Check your email for the reset link
   - Verify the email formatting and content

3. **Reset Password:**
   - Click the reset link
   - Enter a new password
   - Confirm the password
   - Submit the form

4. **Verify Login:**
   - Try logging in with the new password
   - Ensure the old password no longer works

### Test Error Cases

- Invalid email format
- Non-existent email
- Expired token
- Invalid token
- Weak password
- Mismatched password confirmation

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration in `.env`
2. Verify email credentials
3. Check server logs for SMTP errors
4. Ensure firewall allows SMTP traffic

### Database Errors
1. Run the migration SQL manually
2. Check database connection
3. Verify table structure

### Frontend Issues
1. Check browser console for errors
2. Verify route configuration
3. Test API endpoints directly

## Customization

### Email Template
The email template is in `server/routes.ts` around line 220. You can customize:
- Email subject
- HTML content
- Branding colors
- Link styling

### Password Requirements
Password strength requirements are defined in:
- `client/src/pages/login.tsx` (register form)
- `client/src/pages/reset-password.tsx` (reset form)

### Token Expiration
Token expiration time is set in `server/routes.ts`:
```javascript
const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
```

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting for password reset requests
2. **Logging**: Monitor failed password reset attempts
3. **Audit Trail**: Log successful password resets
4. **HTTPS**: Ensure all communication uses HTTPS in production
5. **Email Security**: Use SPF, DKIM, and DMARC for email authentication

## Production Deployment

1. **Environment Variables**: Set all required environment variables
2. **Email Service**: Use a reliable email service (SendGrid, AWS SES, etc.)
3. **Domain**: Update `CLIENT_BASE_URL` with your production domain
4. **SSL**: Ensure HTTPS is enabled
5. **Monitoring**: Set up monitoring for email delivery rates 