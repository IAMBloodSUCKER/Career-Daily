ARG NGINX_IMAGE=nginx:alpine
FROM ${NGINX_IMAGE}
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
