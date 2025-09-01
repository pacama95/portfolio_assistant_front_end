# 🌐 ngrok Setup Guide

This guide shows you how to expose your Portfolio Assistant to the internet using ngrok.

## 🚀 Quick Setup

### 1. Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Windows/Linux:**
Download from https://ngrok.com/download

### 2. Start Your Development Server

```bash
npm run dev
# or for explicit tunnel-ready mode
npm run dev:tunnel
```

### 3. Create the Tunnel

**In a new terminal:**
```bash
ngrok http 5173
```

### 4. Access Your App

ngrok will provide you with URLs like:
- `https://abc123.ngrok-free.app` (HTTPS - recommended)
- `http://abc123.ngrok-free.app` (HTTP)

## ✅ Configuration Already Applied

Your `vite.config.ts` is already configured to allow ngrok hosts:

```typescript
server: {
  host: true,
  allowedHosts: [
    '.ngrok.io',
    '.ngrok-free.app', 
    '.ngrok.app',
    'localhost'
  ]
}
```

## 🔧 Advanced ngrok Usage

### Custom Subdomain (ngrok Pro)
```bash
ngrok http 5173 --subdomain=my-portfolio
# Results in: https://my-portfolio.ngrok-free.app
```

### Basic Authentication
```bash
ngrok http 5173 --basic-auth="username:password"
```

### Configuration File
Create `~/.ngrok2/ngrok.yml`:
```yaml
authtoken: your_auth_token_here
tunnels:
  portfolio:
    proto: http
    addr: 5173
    subdomain: my-portfolio
    host_header: rewrite
```

Then run:
```bash
ngrok start portfolio
```

## 🛡️ Security Considerations

### Free ngrok Limitations
- URLs change each time you restart ngrok
- Warning page shown to visitors
- Limited connections

### For Production
- Use proper deployment (Netlify, Vercel, etc.)
- ngrok is great for testing and demos only

## 🚨 Troubleshooting

### "This site can't be reached"
- Ensure your dev server is running (`npm run dev`)
- Check that ngrok is pointing to the correct port (5173)

### "Blocked request" errors
- Restart your dev server after updating vite.config.ts
- The configuration should already handle this

### ngrok tunnel not working
```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill any conflicting processes
pkill -f vite
```

## 📱 Mobile Testing

With ngrok, you can easily test your portfolio on mobile devices:

1. Start ngrok tunnel
2. Open the ngrok HTTPS URL on your phone
3. Test the mobile-responsive design

## 🔗 Useful Commands

```bash
# Basic tunnel
ngrok http 5173

# With custom region
ngrok http 5173 --region=eu

# Inspect traffic
# Visit http://127.0.0.1:4040 while ngrok is running

# Check ngrok status
ngrok --version
```

---

**🎉 Your Portfolio Assistant is now accessible from anywhere on the internet!**

Share the ngrok URL to demo your portfolio to anyone, anywhere.
