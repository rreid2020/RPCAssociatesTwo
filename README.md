# RPC Associates Website

A production-ready, responsive marketing website for RPC Associates built with React + TypeScript + Vite.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your logo:
   - Place your logo file at `src/assets/rpc-logo.png`
   - Update the import in `src/components/Header.tsx` to use the PNG file instead of the SVG placeholder

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Main app component
├── components/       # All section components
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Services.tsx
│   ├── Why.tsx
│   ├── About.tsx
│   ├── Remote.tsx
│   ├── Contact.tsx
│   └── Footer.tsx
├── styles/
│   └── global.css    # Global styles with BEM naming
└── assets/
    └── rpc-logo.png  # Your logo file (add this)
```

## Features

- Fully responsive design (mobile, tablet, desktop)
- Smooth scrolling navigation
- Mobile hamburger menu
- Accessible semantic HTML
- TypeScript for type safety
- SEO optimized

## Customization

- Colors: Edit CSS custom properties in `src/styles/global.css`
- Content: Update component files in `src/components/`
- Contact form: Currently logs to console - hook up to your backend/form service

## Docker Deployment

### Build and Run Locally

1. Build the Docker image:
   ```bash
   docker build -t rpc-associates .
   ```

2. Run the container:
   ```bash
   docker run -p 80:80 rpc-associates
   ```

3. Or use docker-compose:
   ```bash
   docker-compose up -d
   ```

### Deploy to Digital Ocean

#### Option 1: Using Digital Ocean App Platform

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to Digital Ocean App Platform and create a new app

3. Connect your repository

4. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Run Command: `npx serve -s dist -l 8080`

5. Deploy!

#### Option 2: Using Digital Ocean Droplet with Docker

1. **Create a Droplet:**
   - Go to Digital Ocean and create a new Droplet
   - Choose Ubuntu 22.04 LTS
   - Select a size (minimum 1GB RAM recommended)
   - Add your SSH key

2. **SSH into your Droplet:**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Docker:**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose -y
   ```

4. **Clone your repository (or upload files):**
   ```bash
   # If using Git
   apt install git -y
   git clone your-repo-url
   cd your-repo-name

   # Or use SCP to upload files
   # scp -r . root@your-droplet-ip:/var/www/rpc-associates
   ```

5. **Build and run:**
   ```bash
   docker-compose up -d --build
   ```

6. **Set up Nginx reverse proxy (optional, for custom domain):**
   ```bash
   apt install nginx -y
   
   # Create nginx config
   nano /etc/nginx/sites-available/rpc-associates
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   
   Enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/rpc-associates /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

7. **Set up SSL with Let's Encrypt (recommended):**
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d your-domain.com
   ```

#### Option 3: Using Digital Ocean Container Registry

1. **Install doctl and authenticate:**
   ```bash
   # Install doctl (Digital Ocean CLI)
   # Follow: https://docs.digitalocean.com/reference/doctl/how-to/install/

   # Authenticate
   doctl auth init
   ```

2. **Build and push to registry:**
   ```bash
   # Build image
   docker build -t registry.digitalocean.com/your-registry/rpc-associates .

   # Push to registry
   doctl registry login
   docker push registry.digitalocean.com/your-registry/rpc-associates
   ```

3. **Deploy to App Platform or Droplet:**
   - Use the image from your registry in your deployment configuration

### Environment Variables

If you need environment variables, create a `.env` file and update the Dockerfile to handle them during build, or use Digital Ocean's environment variable settings in App Platform.

### Monitoring and Updates

- **View logs:**
  ```bash
  docker-compose logs -f
  ```

- **Update the application:**
  ```bash
  git pull
  docker-compose up -d --build
  ```

- **Restart container:**
  ```bash
  docker-compose restart
  ```

