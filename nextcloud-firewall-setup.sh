#!/bin/bash
# Nextcloud AIO Firewall Setup Script
# Run this on your DigitalOcean droplet via SSH

echo "Setting up firewall for Nextcloud AIO..."

# Update system
apt update

# Install ufw if not already installed
apt install ufw -y

# Allow SSH (important - do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Nextcloud AIO admin interface ports
ufw allow 8080/tcp
ufw allow 8443/tcp

# Enable firewall
ufw --force enable

# Show status
echo ""
echo "Firewall status:"
ufw status

echo ""
echo "Firewall configured! Try accessing https://138.197.150.94:8080 again"

