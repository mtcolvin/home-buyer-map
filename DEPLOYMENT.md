# Deployment Guide

This guide provides step-by-step instructions for deploying your Home Buyer Map application to various hosting platforms.

## Table of Contents

1. [GitHub Pages](#github-pages)
2. [Netlify](#netlify)
3. [Vercel](#vercel)
4. [Cloudflare Pages](#cloudflare-pages)
5. [AWS S3 + CloudFront](#aws-s3--cloudfront)
6. [Traditional Web Hosting](#traditional-web-hosting)

---

## GitHub Pages

**Best for:** Free hosting, simple setup, great for personal projects

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" tab
   - Scroll down to "Pages" section (left sidebar)
   - Under "Source", select your branch (usually `main`)
   - Select folder: `/ (root)`
   - Click "Save"

3. **Access your site:**
   - Your site will be available at: `https://yourusername.github.io/home-buyer-map`
   - Initial deployment may take 2-5 minutes

### Custom Domain (Optional):

1. In the Pages settings, add your custom domain
2. Update your DNS records:
   ```
   Type: CNAME
   Name: www (or @)
   Value: yourusername.github.io
   ```

**Pros:** Free, easy, automatic updates with git push
**Cons:** Public repositories only (for free tier), limited to static sites

---

## Netlify

**Best for:** Continuous deployment, forms, serverless functions

### Method 1: Drag & Drop (Easiest)

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag your project folder onto the drop zone
3. Your site is live instantly!

### Method 2: Git Integration (Recommended)

1. **Sign up at [Netlify](https://www.netlify.com)**

2. **Connect your repository:**
   - Click "New site from Git"
   - Choose GitHub/GitLab/Bitbucket
   - Select your repository

3. **Configure build settings:**
   ```
   Build command: (leave empty)
   Publish directory: (leave empty or use ".")
   ```

4. **Deploy:**
   - Click "Deploy site"
   - Site will be live in 30-60 seconds

5. **Get your URL:**
   - Netlify provides: `random-name.netlify.app`
   - Change to custom subdomain in Site Settings

### Custom Domain:

1. Site Settings > Domain Management > Add custom domain
2. Follow Netlify's DNS instructions

**Pros:** Auto-deploy on git push, free SSL, great performance, forms support
**Cons:** None for this use case

---

## Vercel

**Best for:** Modern hosting, edge network, excellent performance

### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /path/to/home-buyer-map
   vercel
   ```

3. **Follow prompts:**
   - Login to your account
   - Set up and deploy (just press Enter for defaults)

4. **Your site is live!**
   - Vercel provides a URL: `project-name.vercel.app`

### Production Deployment:

```bash
vercel --prod
```

### Custom Domain:

1. Go to project settings on Vercel dashboard
2. Add domain
3. Update your DNS records as instructed

**Pros:** Lightning fast, global CDN, automatic HTTPS, great DX
**Cons:** None for this use case

---

## Cloudflare Pages

**Best for:** Global performance, DDoS protection, analytics

### Steps:

1. **Sign up at [Cloudflare Pages](https://pages.cloudflare.com)**

2. **Create a new project:**
   - Click "Create a project"
   - Connect your Git repository

3. **Configure:**
   ```
   Build command: (leave empty)
   Build output directory: /
   ```

4. **Deploy:**
   - Click "Save and Deploy"
   - Site live in 1-2 minutes

5. **Access your site:**
   - URL: `project-name.pages.dev`

### Custom Domain:

1. Add domain in Pages settings
2. Update nameservers if using Cloudflare for DNS

**Pros:** Cloudflare's CDN, unlimited bandwidth, free, DDoS protection
**Cons:** Learning curve if new to Cloudflare

---

## AWS S3 + CloudFront

**Best for:** Enterprise hosting, full control, scalability

### Prerequisites:

- AWS Account
- AWS CLI installed

### Steps:

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Configure for static hosting:**
   ```bash
   aws s3 website s3://your-bucket-name --index-document index.html
   ```

3. **Upload files:**
   ```bash
   aws s3 sync . s3://your-bucket-name --exclude ".git/*"
   ```

4. **Set bucket policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

5. **Create CloudFront distribution:**
   - Go to CloudFront console
   - Create distribution
   - Set origin to your S3 bucket
   - Configure SSL certificate

6. **Access your site:**
   - CloudFront URL: `d111111abcdef8.cloudfront.net`
   - Add custom domain via Route 53

**Pros:** Enterprise-grade, highly scalable, full AWS integration
**Cons:** More complex, costs money (though very cheap for static sites)

---

## Traditional Web Hosting

**Best for:** Existing hosting plan, shared hosting

### Steps:

1. **Connect to your hosting via FTP/SFTP:**
   - Use FileZilla, Cyberduck, or your hosting's file manager

2. **Upload all files to your public_html folder:**
   ```
   home-buyer-map/
   ├── index.html
   ├── styles.css
   ├── app.js
   ├── README.md
   └── package.json
   ```

3. **Set permissions:**
   - Files: 644
   - Folders: 755

4. **Access your site:**
   - Visit: `https://yourdomain.com`

**Pros:** Simple, works with existing hosting
**Cons:** Manual updates, slower than modern platforms

---

## Testing Before Deployment

Always test locally first:

```bash
# Option 1: Python 3
python3 -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000

# Option 3: Node.js
npx http-server

# Option 4: PHP
php -S localhost:8000
```

Visit `http://localhost:8000` to test.

---

## Recommended Workflow

1. **Development:**
   - Test locally
   - Make changes
   - Commit to git

2. **Staging:**
   - Push to GitHub
   - Auto-deploy to Netlify/Vercel preview

3. **Production:**
   - Merge to main branch
   - Auto-deploy to production

---

## Performance Optimization

### Before deploying:

1. **Enable compression** (most hosts do this automatically)
2. **Check Lighthouse score:**
   - Open Chrome DevTools
   - Run Lighthouse audit
   - Aim for 90+ scores

### After deploying:

1. **Add caching headers** (if using custom server)
2. **Enable HTTPS** (most modern hosts do this automatically)
3. **Test on multiple devices**

---

## Troubleshooting

### Map not loading:
- Check console for errors
- Ensure you're accessing via HTTP/HTTPS (not file://)

### Styles not working:
- Check file paths are correct
- Ensure files are uploaded correctly

### Search not working:
- OpenStreetMap API requires internet connection
- Check browser console for errors

---

## Monitoring & Analytics

Add analytics to track usage:

### Google Analytics:

Add before `</head>` in index.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

### Plausible (Privacy-friendly):

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/plausible.js"></script>
```

---

## Support

For issues or questions:
- Check browser console for errors
- Review this deployment guide
- Check hosting provider's documentation

---

## Summary

**Fastest:** Netlify Drop (drag & drop)
**Best for beginners:** GitHub Pages
**Best for professionals:** Vercel or Netlify with Git
**Most powerful:** AWS S3 + CloudFront

Choose based on your needs and experience level. All options will work great for this application!
