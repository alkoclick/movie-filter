FROM caddy

COPY site /srv
COPY Caddyfile /etc/caddy/Caddyfile
