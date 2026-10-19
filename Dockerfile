FROM node:20.20.2-bookworm

# Electron needs desktop, audio, and Chromium libraries at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fakeroot \
    fonts-liberation \
    git \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgl1 \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libsecret-1-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    rpm \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
    && mkdir -p /run/user/1000/pulse \
    && mkdir -p /workspace/node_modules \
    && mkdir -p /home/node/.config /home/node/.yarn/berry \
    && chown -R node:node /run/user/1000 \
    && chown -R node:node /workspace \
    && chown -R node:node /home/node/.config /home/node/.yarn \
    && chmod 700 /run/user/1000

COPY docker/entrypoint.sh /usr/local/bin/scstym-entrypoint

USER node
WORKDIR /workspace
ENTRYPOINT ["sh", "/usr/local/bin/scstym-entrypoint"]
CMD ["yarn", "electron-forge", "start", "--", "--no-sandbox"]
