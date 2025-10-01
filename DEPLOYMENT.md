# 🚀 Deployment Guide

This document provides comprehensive instructions for deploying your Portfolio Assistant web application to the internet.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Backend API running and accessible

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

**Quick Deploy:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your app
npm run build

# Deploy to production
netlify deploy --prod --dir=dist
```

**Auto-Deploy from Git:**
1. Push your code to GitHub/GitLab
2. Connect your repository at [netlify.com](https://netlify.com)
3. Netlify will auto-detect the build settings using `netlify.toml`

### Option 2: Vercel

**Quick Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (auto-detects settings)
vercel --prod
```

**Auto-Deploy from Git:**
1. Connect your repository at [vercel.com](https://vercel.com)
2. Vercel uses the `vercel.json` configuration automatically

### Option 3: GitHub Pages

**Automatic Deployment:**
1. Push to your `main` branch
2. Enable GitHub Pages in repository settings
3. The GitHub Action will automatically build and deploy

**Manual Deployment:**
```bash
# Install gh-pages
npm install -g gh-pages

# Build and deploy
npm run build
gh-pages -d dist
```

### Option 4: Docker Deployment

**Local Docker:**
```bash
# Build image
docker build -t portfolio-assistant .

# Run container
docker run -p 8080:80 portfolio-assistant
```

**Docker Compose:**
```bash
docker-compose up -d
```

**Deploy to Cloud:**
- AWS ECS, Google Cloud Run, Azure Container Instances
- DigitalOcean App Platform, Railway, Render

### Option 5: Traditional VPS/Server

```bash
# Build the application
npm run build

# Upload the 'dist' folder to your server
# Configure nginx/apache to serve the files
# Point domain to your server
```

## 🔧 Environment Configuration

### Backend API URLs

Update your API base URLs for production in `src/api/client.ts`:

```typescript
const TRANSACTIONS_API_BASE_URL = import.meta.env.VITE_TRANSACTIONS_API_URL || 'https://your-transactions-api.com/api';
const PORTFOLIO_API_BASE_URL = import.meta.env.VITE_PORTFOLIO_API_URL || 'https://your-portfolio-api.com/api';
```

Then set the environment variables:
- **Netlify/Vercel**: Set `VITE_TRANSACTIONS_API_URL` and `VITE_PORTFOLIO_API_URL` in the dashboard
- **Docker**: Add to docker-compose.yml or Dockerfile
- **GitHub Pages**: Not applicable (static hosting only)

## 🌐 Quick Testing with Tunneling

### Using ngrok
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start your dev server
npm run dev

# In another terminal
ngrok http 5173
```

### Using Vite's Network Mode
```bash
# Expose to local network
npm run dev:host

# Your app will be accessible via your local IP
# Example: http://192.168.1.100:5173
```

## 📡 Domain Configuration

### Custom Domain Setup

**Netlify:**
1. Go to Site Settings > Domain Management
2. Add your custom domain
3. Netlify will handle SSL certificates automatically

**Vercel:**
1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

**GitHub Pages:**
1. Add a `CNAME` file to your repository root with your domain
2. Configure DNS to point to your GitHub Pages URL

## 🔒 Production Considerations

### 1. Environment Variables
```bash
# Example .env.production
VITE_TRANSACTIONS_API_URL=https://transactions-api.yourbackend.com/api
VITE_PORTFOLIO_API_URL=https://portfolio-api.yourbackend.com/api
VITE_LOGO_API_URL=https://logo-api.yourbackend.com
VITE_SUGGESTIONS_API_URL=https://suggestions-api.yourbackend.com
VITE_DIVIDENDS_API_URL=https://dividends-api.yourbackend.com
VITE_APP_NAME=Portfolio Assistant
```

### 2. Security Headers
Most hosting platforms handle this, but for custom servers:
```nginx
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
```

### 3. HTTPS/SSL
- All recommended platforms (Netlify, Vercel) provide free SSL
- For custom servers, use Let's Encrypt

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Production build with optimizations
npm run build
```

### CDN and Caching
- Netlify/Vercel automatically handle CDN
- For custom servers, consider CloudFlare or AWS CloudFront

## 🔍 Monitoring and Analytics

### Add Analytics (Optional)
```typescript
// In your index.html or App.tsx
// Google Analytics, Plausible, or similar
```

### Error Monitoring
```bash
# Install Sentry or similar
npm install @sentry/react
```

## 🚨 Troubleshooting

### Common Issues

1. **Blank page after deployment**
   - Check console for API connection errors
   - Verify `VITE_TRANSACTIONS_API_URL` and `VITE_PORTFOLIO_API_URL` are set correctly
   - Verify `VITE_LOGO_API_URL`, `VITE_SUGGESTIONS_API_URL`, and `VITE_DIVIDENDS_API_URL` are set correctly

2. **404 on refresh**
   - Ensure your hosting platform supports SPA routing
   - Check `netlify.toml` or `vercel.json` redirects

3. **Build fails**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

## 📞 Support

If you encounter issues:
1. Check the hosting platform's documentation
2. Verify your backend API is accessible
3. Review browser console for errors

---

**🎉 Your Portfolio Assistant is now ready for the world!**
