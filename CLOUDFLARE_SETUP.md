# Cloudflare Access Setup Guide

This guide explains how to set up Cloudflare Access for protecting the admin panel with authentication.

## Prerequisites

- A Cloudflare account with Cloudflare Zero Trust
- Your domain (qr-menu.fx8.io) set up in Cloudflare DNS
- Admin panel already deployed to Vercel

## Setup Steps

### 1. Enable Cloudflare Zero Trust

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Zero Trust** → **Access** → **Applications**
3. Click **Create an Application**

### 2. Create Access Policy for Admin Routes

1. **Application name**: `qr-menu-admin`
2. **Application type**: Select "Self-hosted"
3. **Session duration**: 24 hours (or your preference)

4. **Set subdomain/path**:
   - Domain: `qr-menu.fx8.io`
   - Path: `/admin` (or `/admin/*` for all admin routes)

### 3. Configure Authentication Rules

1. In **Authentication rules** section, add a rule:
   - **Action**: `Allow`
   - **Rule**: `Emails ending with`
   - **Value**: `@fx8.io` (or your domain)

2. You can also add specific emails:
   - **Action**: `Allow`
   - **Rule**: `Emails`
   - **Value**: `admin@example.com, manager@example.com`

### 4. Configure Identity Providers

Choose your preferred authentication method:

**Option A: Email One-Time Passcode (Recommended for simplicity)**
- Cloudflare sends a one-time code to user's email
- No external provider needed

**Option B: Google Workspace**
1. Go to **Settings** → **Authentication** → **Login methods**
2. Select **Google Workspace**
3. Configure with your Google Workspace domain

**Option C: Azure AD / Okta / Other OIDC Providers**
1. Go to **Settings** → **Authentication** → **Login methods**
2. Select the provider
3. Follow provider-specific setup instructions

### 5. Add Firewall Rules (Optional)

To further restrict access:

1. Go to **Security** → **WAF** → **Firewall rules**
2. Create a rule for `/admin` path:
   ```
   (cf.access.authenticated and not (cf.access.user_email contains "@fx8.io"))
   ```

### 6. Test the Setup

1. Navigate to `https://qr-menu.fx8.io/admin`
2. You should be prompted to authenticate
3. After authentication, you'll be able to access the admin panel

## How It Works

When Cloudflare Access is enabled:

1. User navigates to `https://qr-menu.fx8.io/admin`
2. Cloudflare intercepts the request and checks authentication
3. If not authenticated, user is sent to login page
4. After successful authentication, Cloudflare adds these headers to the request:
   - `CF-Access-Authenticated-User-Email`: User's email
   - `CF-Access-Authenticated-User-Name`: User's name
   - `CF-Access-Authenticated-User-Phone`: User's phone (if available)
   - `CF-Access-Token`: JWT token

5. The Next.js frontend queries `/api/auth/cloudflare-user`
6. The API returns the user information from Cloudflare headers
7. The admin panel checks if user is authenticated

## Environment Configuration

No additional environment variables are needed for the web app. The authentication happens at the Cloudflare edge before the request reaches your application.

For the API, ensure it trusts Cloudflare headers. This is already configured in the auth controller.

## Security Considerations

- **HTTPS only**: Cloudflare Access requires HTTPS
- **Header validation**: In production, verify that headers come from Cloudflare
- **Token verification**: Optionally verify the `CF-Access-Token` JWT on your backend
- **Rate limiting**: Consider adding rate limiting to auth endpoints

## Troubleshooting

### Users can't see the admin panel
- Check that the Cloudflare Access application covers the correct path (`/admin/*`)
- Verify authentication rules are configured correctly

### "Unauthorized" error
- Ensure user's email matches the authentication rules
- Check that the identity provider is correctly configured

### Headers not being received
- Verify Cloudflare Access application is enabled
- Check that the domain is properly configured in Cloudflare DNS

## Additional Resources

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/)
- [Cloudflare Identity Providers](https://developers.cloudflare.com/cloudflare-one/identity/)
- [JWT Token Verification](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/jwt-verification/)
