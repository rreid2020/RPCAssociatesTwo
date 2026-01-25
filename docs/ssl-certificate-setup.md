# SSL Certificate Setup Guide

This guide covers setting up SSL certificates for your RPC Associates website on Digital Ocean.

## Option 1: Digital Ocean App Platform (Automatic SSL)

If you're using **Digital Ocean App Platform**, SSL certificates are **automatically provisioned** when you add a custom domain. No manual configuration needed!

### Steps:
1. Go to your App → Settings → Domains
2. Add your domain: `rpcassociates.co`
3. Add the www subdomain: `www.rpcassociates.co`
4. Update your DNS records as instructed
5. Digital Ocean automatically provisions Let's Encrypt SSL certificates
6. Wait 5-10 minutes for certificates to be issued

**That's it!** Your site will automatically use HTTPS.

---

## Option 2: Docker on Droplet (Manual SSL Setup)

If you're using **Docker on a Droplet**, you need to set up SSL certificates manually using Let's Encrypt (free) or another certificate authority.

### Prerequisites
- Domain name pointing to your Droplet IP
- DNS A records configured:
  - `rpcassociates.co` → Your Droplet IP
  - `www.rpcassociates.co` → Your Droplet IP
- Ports 80 and 443 open in your firewall

### Method 1: Using Certbot with Let's Encrypt (Recommended - Free)

#### Step 1: Install Certbot

SSH into your Droplet and run:

```bash
# Update system
apt update && apt upgrade -y

# Install Certbot
apt install certbot python3-certbot-nginx -y
```

#### Step 2: Stop Your Docker Container (Temporarily)

```bash
cd /var/www/rpc-associates  # or wherever your app is
docker-compose down
```

#### Step 3: Install Nginx on Host (For Certbot)

Certbot needs to interact with Nginx to verify domain ownership:

```bash
# Install Nginx
apt install nginx -y

# Create a temporary Nginx config for certificate verification
nano /etc/nginx/sites-available/rpc-associates-temp
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name rpcassociates.co www.rpcassociates.co;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/rpc-associates-temp /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

#### Step 4: Obtain SSL Certificates

```bash
certbot certonly --nginx -d rpcassociates.co -d www.rpcassociates.co
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to share email with EFF (optional)

Certificates will be saved to:
- `/etc/letsencrypt/live/rpcassociates.co/fullchain.pem`
- `/etc/letsencrypt/live/rpcassociates.co/privkey.pem`

#### Step 5: Update Your Docker Setup

You have two options:

**Option A: Mount Certificates into Docker Container**

1. Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    environment:
      - NODE_ENV=production
```

2. Update your `nginx.conf` to use the mounted certificates:

```nginx
# HTTPS - www to non-www redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.rpcassociates.co;
    
    ssl_certificate /etc/letsencrypt/live/rpcassociates.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpcassociates.co/privkey.pem;
    
    # Redirect www to non-www
    return 301 https://rpcassociates.co$request_uri;
}

# Main HTTPS server - non-www
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name rpcassociates.co;
    root /usr/share/nginx/html;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/rpcassociates.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpcassociates.co/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ... rest of your nginx config ...
}
```

**Option B: Use Nginx on Host as Reverse Proxy (Simpler)**

Keep Docker container on port 8080, use host Nginx on ports 80/443:

1. Update `docker-compose.yml` to use port 8080:

```yaml
ports:
  - "8080:80"  # Changed from "80:80"
```

2. Create proper Nginx config on host:

```bash
nano /etc/nginx/sites-available/rpc-associates
```

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name rpcassociates.co www.rpcassociates.co;
    return 301 https://rpcassociates.co$request_uri;
}

# HTTPS - www to non-www redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.rpcassociates.co;
    
    ssl_certificate /etc/letsencrypt/live/rpcassociates.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpcassociates.co/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    return 301 https://rpcassociates.co$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name rpcassociates.co;
    
    ssl_certificate /etc/letsencrypt/live/rpcassociates.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpcassociates.co/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:

```bash
ln -s /etc/nginx/sites-available/rpc-associates /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/rpc-associates-temp
nginx -t
systemctl restart nginx
```

#### Step 6: Start Docker Container

```bash
cd /var/www/rpc-associates
docker-compose up -d
```

#### Step 7: Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
certbot renew --dry-run

# Certbot automatically sets up a systemd timer, but verify it's active:
systemctl status certbot.timer

# If not active, enable it:
systemctl enable certbot.timer
systemctl start certbot.timer
```

The timer will automatically renew certificates and reload Nginx.

---

### Method 2: Using Cloudflare (Alternative - Free SSL)

If you're using Cloudflare as your DNS/CDN provider:

1. **Add your domain to Cloudflare**
2. **Update nameservers** at your domain registrar
3. **Enable SSL/TLS** in Cloudflare dashboard:
   - Go to SSL/TLS settings
   - Set encryption mode to "Full" or "Full (strict)"
4. **Cloudflare provides free SSL** - no certificate installation needed!
5. **Update nginx.conf** to accept Cloudflare's proxy:

```nginx
# Cloudflare IP ranges (add to nginx.conf)
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;
```

---

## Verify SSL Setup

After setup, verify your SSL certificate:

1. **Visit your site:** `https://rpcassociates.co`
2. **Check certificate:** Click the padlock icon in your browser
3. **Test with SSL Labs:** https://www.ssllabs.com/ssltest/analyze.html?d=rpcassociates.co
4. **Test redirects:**
   - `http://rpcassociates.co` → Should redirect to `https://rpcassociates.co`
   - `https://www.rpcassociates.co` → Should redirect to `https://rpcassociates.co`

---

## Troubleshooting

### Certificate Not Issued
- **Check DNS:** Ensure A records point to your Droplet IP
- **Check ports:** Ensure ports 80 and 443 are open: `ufw allow 80/tcp && ufw allow 443/tcp`
- **Check domain:** Wait for DNS propagation (can take up to 48 hours)

### Certificate Expired
- **Renew manually:** `certbot renew`
- **Check auto-renewal:** `systemctl status certbot.timer`
- **View logs:** `journalctl -u certbot.timer`

### Nginx Won't Start
- **Test config:** `nginx -t`
- **Check logs:** `tail -f /var/log/nginx/error.log`
- **Verify certificate paths:** Ensure paths in nginx.conf match actual certificate locations

### Docker Container Can't Access Certificates
- **Check volume mount:** Verify certificates are mounted correctly
- **Check permissions:** Certificates should be readable: `ls -la /etc/letsencrypt/live/rpcassociates.co/`
- **Use Option B:** Consider using host Nginx as reverse proxy instead

---

## Security Best Practices

1. **Use strong SSL configuration:**
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers HIGH:!aNULL:!MD5;
   ssl_prefer_server_ciphers on;
   ```

2. **Enable HSTS:**
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   ```

3. **Keep certificates updated:**
   - Let's Encrypt auto-renews, but monitor the timer
   - Set up email notifications for renewal failures

4. **Monitor certificate expiration:**
   ```bash
   certbot certificates
   ```

---

## Quick Reference

### Certificate Locations (Let's Encrypt)
- **Certificate:** `/etc/letsencrypt/live/rpcassociates.co/fullchain.pem`
- **Private Key:** `/etc/letsencrypt/live/rpcassociates.co/privkey.pem`
- **Certificate Chain:** `/etc/letsencrypt/live/rpcassociates.co/chain.pem`

### Useful Commands
```bash
# Check certificate status
certbot certificates

# Renew certificates manually
certbot renew

# Test renewal (dry run)
certbot renew --dry-run

# Check auto-renewal timer
systemctl status certbot.timer

# View renewal logs
journalctl -u certbot.timer
```

---

## Need Help?

- **Let's Encrypt Docs:** https://letsencrypt.org/docs/
- **Certbot Docs:** https://certbot.eff.org/
- **Digital Ocean SSL Guide:** https://docs.digitalocean.com/products/networking/dns/how-to/manage-ssl-certificates/
