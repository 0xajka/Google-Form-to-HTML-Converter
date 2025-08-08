# Deployment Guide for Vercel

## Prerequisites
- Vercel account (free at vercel.com)
- Git repository connected to Vercel

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "feat: prepare for Vercel deployment"
   git push origin dev
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Node.js setup

3. **Deploy**
   - Vercel will automatically deploy on every push to your main branch
   - You can also manually deploy from the Vercel dashboard

## Configuration

The project includes:
- `vercel.json` - Vercel configuration
- `server.js` - Express server with static file serving
- Updated API endpoints to work with Vercel's serverless functions

## Features After Deployment

✅ **Asynchronous Form Submission** - No more redirects  
✅ **Modern UI with Tailwind CSS** - Responsive design  
✅ **Real-time Status Updates** - User feedback  
✅ **Form Reset** - Automatic field clearing  
✅ **Error Handling** - Graceful error management  

## Environment Variables

No environment variables are required for basic functionality.

## Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain

## Troubleshooting

- **CORS Issues**: The server includes CORS headers for cross-origin requests
- **Static Files**: All static files are served from the root directory
- **API Routes**: The `/fetch-form` endpoint is properly configured for Vercel
