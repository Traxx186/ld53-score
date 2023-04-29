FROM denoland/deno:alpine

# The port that your application listens to.
EXPOSE 8000

WORKDIR /srv

# Prefer not to run as root.
USER deno

# These steps will be re-run upon each file change in your working directory:
COPY src/ ./

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache server.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "server.ts"]