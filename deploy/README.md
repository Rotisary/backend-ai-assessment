# Deployment (DigitalOcean Droplet)

This folder contains the nginx config template used to reverse-proxy the API container.

- Copy deploy/nginx.conf to /etc/nginx/sites-available/your-domain
- Replace your-domain.example with your actual domain
- Enable the site and request TLS via Certbot
