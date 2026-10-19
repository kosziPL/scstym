# scstym in Docker

This is a Linux desktop development setup. It runs the app with Node.js 20.20.2
and the repository's Yarn 4.5.1. The host's Node.js, Yarn, and existing
`node_modules` are left alone.

## Run the app

Install Docker Engine with the Compose plugin. Start the Docker daemon and make
sure your user can access it. Then run from the repository root in your graphical
login session:

```sh
docker compose up --build
```

The container uses X11 (including XWayland sessions), the current Xauthority
file, the session D-Bus, and the PulseAudio-compatible socket. `DISPLAY`,
`XAUTHORITY`, and `XDG_RUNTIME_DIR` must be set in the shell. The default
container user has UID 1000, matching the current Linux desktop user.

The source is bind-mounted. Dependencies and app settings live in separate Docker
volumes; the host's `node_modules` is never mounted into the container. On each
start, Yarn checks the lockfile and installs missing dependencies. The
companion-server port 9863 is published only on the host's loopback interface.

Electron is started with `--no-sandbox` because this configuration is for local
development inside a container. Do not use this setup to distribute the app.

## Other commands

```sh
docker compose run --rm scstym yarn typecheck
docker compose run --rm scstym yarn make
docker compose down
```

`yarn make` may need additional distro-specific packaging tools.
