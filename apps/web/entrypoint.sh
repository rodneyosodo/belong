#!/bin/sh
envsubst < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/env.js
exec nginx -g 'daemon off;'
