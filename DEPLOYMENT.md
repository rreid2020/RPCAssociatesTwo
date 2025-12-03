# Deployment Guide - Digital Ocean

This guide covers deploying the RPC Associates website to Digital Ocean using Docker.

## Prerequisites

- A Digital Ocean account
- Docker installed locally (for testing)
- Git repository (GitHub, GitLab, or Bitbucket) - recommended
- Domain name (optional, but recommended)

## Quick Start: Digital Ocean App Platform

The easiest way to deploy is using Digital Ocean App Platform:

1. **Push code to Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Create App in Digital Ocean:**
   - Go to https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Connect your Git repository
   - Select the branch (usually `main` or `master`)

3. **Configure Build Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Run Command:** `npx serve -s dist -l 8080`
   - **HTTP Port:** `8080`

4. **Add Environment Variables (if needed):**
   - Add any required environment variables in the App Platform settings

5. **Deploy:**
   - Click "Create Resources"
   - Wait for deployment to complete
   - Your app will be live at `your-app-name.ondigitalocean.app`

6. **Custom Domain (Optional):**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

## Manual Deployment: Docker on Droplet

### Step 1: Create a Droplet

1. Log in to Digital Ocean
2. Click "Create" → "Droplets"
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/month minimum recommended)
   - **Region:** Choose closest to your users
   - **Authentication:** SSH keys (recommended) or password
4. Click "Create Droplet"

### Step 2: Initial Server Setup

1. **SSH into your Droplet:**
   ```bash
   ssh root@your-droplet-ip
   ```

2. **Update system:**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Install Docker Compose:**
   ```bash
   apt install docker-compose -y
   ```

5. **Verify installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

### Step 3: Deploy Application

1. **Create application directory:**
   ```bash
   mkdir -p /var/www/rpc-associates
   cd /var/www/rpc-associates
   ```

2. **Upload your code:**
   
   **Option A: Using Git (Recommended)**
   ```bash
   apt install git -y
   git clone your-repo-url .
   ```

   **Option B: Using SCP (from your local machine)**
   ```bash
   # From your local machine
   scp -r . root@your-droplet-ip:/var/www/rpc-associates
   ```

3. **Build and run:**
   ```bash
   cd /var/www/rpc-associates
   docker-compose up -d --build
   ```

4. **Verify it's running:**
   ```bash
   docker-compose ps
   curl http://localhost
   ```

5. **Access your site:**
   - Open `http://your-droplet-ip` in your browser

### Step 4: Set Up Custom Domain (Optional)

1. **Install Nginx:**
   ```bash
   apt install nginx -y
   ```

2. **Create Nginx configuration:**
   ```bash
   nano /etc/nginx/sites-available/rpc-associates
   ```

3. **Add this configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable the site:**
   ```bash
   ln -s /etc/nginx/sites-available/rpc-associates /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t
   systemctl restart nginx
   ```

5. **Update DNS:**
   - Go to your domain registrar
   - Add an A record pointing to your Droplet IP
   - Wait for DNS propagation (can take up to 48 hours, usually much faster)

### Step 5: Set Up SSL (HTTPS)

1. **Install Certbot:**
   ```bash
   apt install certbot python3-certbot-nginx -y
   ```

2. **Get SSL certificate:**
   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Follow the prompts:**
   - Enter your email
   - Agree to terms
   - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

4. **Test auto-renewal:**
   ```bash
   certbot renew --dry-run
   ```

SSL certificates auto-renew, so you're all set!

## Updating Your Application

When you make changes to your code:

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```

2. **On your Droplet:**
   ```bash
   cd /var/www/rpc-associates
   git pull
   docker-compose up -d --build
   ```

Or set up automatic deployments using webhooks or CI/CD.

## Monitoring and Maintenance

### View Logs
```bash
docker-compose logs -f
```

### Restart Application
```bash
docker-compose restart
```

### Stop Application
```bash
docker-compose down
```

### Check Container Status
```bash
docker-compose ps
```

### Update System Packages
```bash
apt update && apt upgrade -y
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs`
- Verify Docker is running: `systemctl status docker`
- Check port 80 is available: `netstat -tulpn | grep :80`

### Can't access site
- Check firewall: `ufw status`
- Open port 80: `ufw allow 80/tcp`
- Verify container is running: `docker-compose ps`

### SSL certificate issues
- Ensure DNS is pointing to your Droplet
- Check Nginx config: `nginx -t`
- Review Certbot logs: `journalctl -u certbot.timer`

## Cost Estimate

- **Droplet:** $6-12/month (Basic plan)
- **App Platform:** $5-12/month (Basic plan)
- **Domain:** ~$10-15/year (if using custom domain)
- **Total:** ~$6-15/month

## Security Recommendations

1. **Set up firewall:**
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

2. **Disable root login (create a user):**
   ```bash
   adduser yourusername
   usermod -aG sudo yourusername
   # Then configure SSH to disable root login
   ```

3. **Keep system updated:**
   ```bash
   apt update && apt upgrade -y
   ```

4. **Use SSH keys instead of passwords**

5. **Regular backups** (Digital Ocean offers automated backups)

## Support

For issues:
- Check Docker logs: `docker-compose logs`
- Digital Ocean documentation: https://docs.digitalocean.com
- Docker documentation: https://docs.docker.com

