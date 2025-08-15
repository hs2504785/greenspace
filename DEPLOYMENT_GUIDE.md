# Vercel Deployment Guide for Greenspace Project

This guide will help you deploy your Next.js application to Vercel production environment.

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
3. **Environment Variables**: Gather all required API keys and secrets

## Required Environment Variables

Set up the following environment variables in Vercel:

### Authentication

- `NEXTAUTH_URL` - Your production domain (e.g., `https://your-domain.vercel.app`)
- `NEXTAUTH_SECRET` - A secure random string (generate new one for production)

### Google OAuth

- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret

### Supabase Configuration

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### Twilio for OTP (if using SMS)

- `TWILIO_ACCOUNT_SID` - Your Twilio account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio auth token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number

## Step-by-Step Deployment

### 1. Prepare Your Code

```bash
# Ensure all changes are committed and pushed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select "greenspace" project

### 3. Configure Build Settings

Vercel should automatically detect Next.js settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: Leave empty (auto-detected)
- **Install Command**: `npm install`

### 4. Set Environment Variables

In Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add all the required environment variables listed above
3. Set them for "Production" environment

### 5. Configure Domain Settings

After deployment:

1. Go to Settings → Domains
2. Add your custom domain (if you have one)
3. Update `NEXTAUTH_URL` environment variable to match your domain

### 6. Deploy

1. Click "Deploy" to start the deployment
2. Wait for the build to complete (usually 2-5 minutes)
3. Your app will be available at `https://your-project-name.vercel.app`

## Post-Deployment Configuration

### 1. Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to "Authorized redirect URIs":
   - `https://your-domain.vercel.app/api/auth/callback/google`

### 2. Update Supabase Settings

1. Go to your Supabase dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel domain to "Site URL"
4. Add redirect URL: `https://your-domain.vercel.app/api/auth/callback/supabase`

### 3. Test Your Deployment

1. Visit your deployed application
2. Test authentication flows:
   - Google OAuth login
   - Mobile OTP login
3. Test database connectivity
4. Verify all features work correctly

## Environment Variables Security

### Generate Secure NEXTAUTH_SECRET

```bash
# Generate a new secure secret for production
openssl rand -base64 32
```

### Environment Variable Checklist

- [ ] `NEXTAUTH_URL` - Set to your production domain
- [ ] `NEXTAUTH_SECRET` - Generated new secure secret
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - From Supabase dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard
- [ ] `TWILIO_ACCOUNT_SID` - From Twilio console
- [ ] `TWILIO_AUTH_TOKEN` - From Twilio console
- [ ] `TWILIO_PHONE_NUMBER` - From Twilio console

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Authentication Issues**

   - Verify NEXTAUTH_URL matches your domain
   - Check Google OAuth redirect URIs
   - Ensure NEXTAUTH_SECRET is set

3. **Database Connection Issues**

   - Verify Supabase environment variables
   - Check Supabase project status
   - Ensure RLS policies are configured correctly

4. **API Route Failures**
   - Check function logs in Vercel dashboard
   - Verify environment variables are set
   - Test API endpoints independently

### Monitoring and Logs

1. **Vercel Dashboard**: Monitor deployment status and function logs
2. **Real-time Logs**: Use `vercel logs` CLI command
3. **Analytics**: Enable Vercel Analytics for performance monitoring

## Development vs Production

| Setting         | Development           | Production                     |
| --------------- | --------------------- | ------------------------------ |
| NEXTAUTH_URL    | http://localhost:3000 | https://your-domain.vercel.app |
| NEXTAUTH_SECRET | Development secret    | Secure generated secret        |
| Database        | Development/Staging   | Production database            |
| OAuth Redirects | localhost:3000        | your-domain.vercel.app         |

## Continuous Deployment

Once set up, Vercel will automatically:

- Deploy on every push to main branch
- Run build and tests
- Update your production environment
- Provide deployment previews for pull requests

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
