# DevOps 101

A tiny guestbook app used to teach Docker Compose, CI/CD with GitHub Actions, and Kubernetes.

```
browser ──> Caddy (HTTPS) ──> frontend (Next.js) ──> backend (FastAPI) ──> Postgres + Redis
```

The browser only talks to the frontend. The frontend calls the backend server-side, over the
private Docker network.

## What's in the repo

| Path | What it is |
| --- | --- |
| `frontend/` | Next.js app (App Router, TypeScript). Change `TITLE` in `app/page.tsx` during the demo |
| `backend/` | FastAPI app: `/health`, `/api/info` (visit counter in Redis), `/api/guestbook` (Postgres) |
| `docker-compose.yaml` | Runs all 4 containers, locally and on the VM |
| `k8s/` | The same backend on Kubernetes: `deployment.yaml`, `hpa.yaml`, `infra.yaml` (demo-only DB/Redis) |
| `deploy/` | `Caddyfile`, `deploy.sh`, and `.env.example` for the VM |
| `.github/workflows/` | `ci.yml` checks every PR. `cd.yml` builds, pushes and deploys every merge to `main` |

## Run locally (OrbStack or Docker Desktop)

```bash
docker compose up --build        # then open http://localhost:3000
docker compose logs -f backend   # watch the logs
docker compose down              # stop (add -v to also wipe the database)
```

## One-time VM setup (Contabo / Hetzner, Ubuntu)

1. **Install Docker and Caddy** on the VM:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER            # log out and back in afterwards
   # Caddy: https://caddyserver.com/docs/install#debian-ubuntu-raspbian
   ```
   Open ports 80 and 443 in the firewall.
2. **Clone the repo** to `/opt/devops-101`:
   ```bash
   sudo git clone https://github.com/PurpleRadish42/devops-101.git /opt/devops-101
   sudo chown -R $USER /opt/devops-101
   ```
3. **Create the env files** in `/opt/devops-101`. Use a different long password in each:
   ```bash
   cd /opt/devops-101
   cp deploy/.env.example .env.staging      # APP_ENV=staging,    FRONTEND_PORT=3001
   cp deploy/.env.example .env.production   # APP_ENV=production, FRONTEND_PORT=3000
   nano .env.staging .env.production
   ```
4. **DNS:** create two A records pointing at the VM's IP: `example.com` and `staging.example.com`.
5. **Caddy:** copy the Caddyfile and set the domain:
   ```bash
   sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
   sudo systemctl edit caddy     # add:  [Service]  Environment=DOMAIN=example.com
   sudo systemctl restart caddy  # HTTPS certificates are fetched automatically
   ```
   You can also replace `{$DOMAIN}` in the Caddyfile with your domain.
6. **SSH key for GitHub Actions:** generate a key pair just for deploys:
   ```bash
   ssh-keygen -t ed25519 -f devops101_deploy -N ""   # on your laptop
   # add devops101_deploy.pub to ~/.ssh/authorized_keys on the VM
   ```
7. **GitHub repo secrets** (Settings → Secrets and variables → Actions):
   `SSH_HOST` (VM IP), `SSH_USER` (VM user), `SSH_KEY` (contents of the private key `devops101_deploy`).
8. **GitHub environments** (Settings → Environments): create `staging` and `production`.
   On `production`, turn on **Required reviewers** and add yourself. If you're the only
   reviewer, leave "Prevent self-review" off.
9. **Make the images pullable.** GHCR packages start out **private**. After the first CD run,
   go to your GitHub profile → Packages → `devops-101-frontend` / `devops-101-backend` →
   Package settings → Change visibility → **Public**, then re-run the failed deploy job.
   Or keep them private and run `docker login ghcr.io` on the VM with a token that has `read:packages`.
10. *(Optional)* Add a branch ruleset on `main` that requires the CI checks to pass before merging.

## Live demo runbook

1. Open `https://example.com` (production, green) and `https://staging.example.com` (staging, amber).
   Students sign the guestbook from their phones.
2. Create a branch and change the title:
   ```bash
   git switch -c new-title
   # edit TITLE in frontend/app/page.tsx
   git commit -am "Change title" && git push -u origin new-title
   ```
3. Open a PR. **CI** runs lint, build, tests and Docker builds. Wait for it to go green.
4. Merge the PR. **CD** starts: build & push images → deploy to **staging** automatically.
5. Refresh staging. It shows the new title and the new version (commit SHA). Production still shows the old ones.
6. In the Actions tab, **approve** the `deploy-production` job.
7. Refresh production. It now runs the new version.

**Fallback if CD misbehaves:** deploy by hand. This is also how you roll back (use an older SHA):

```bash
ssh user@your-vm
cd /opt/devops-101 && ./deploy/deploy.sh production <commit-sha>
```

## Optional: Kubernetes on OrbStack

Enable Kubernetes in OrbStack's settings. OrbStack's Kubernetes uses your locally built images, so nothing needs to be pushed.

```bash
kubectl config use-context orbstack        # make sure you're NOT pointed at a real cluster!
docker compose build                       # builds ghcr.io/...-backend:latest locally
kubectl apply -f k8s/infra.yaml -f k8s/deployment.yaml
kubectl get pods -w                        # backend may restart once while Postgres starts

kubectl port-forward svc/backend 8000:8000 # then: curl localhost:8000/api/info

kubectl delete pod <one-backend-pod>       # self-healing: a new pod replaces it
kubectl scale deployment/backend --replicas=5
kubectl set env deployment/backend APP_VERSION=v2   # rolling update (or: kubectl rollout restart deployment/backend)
kubectl rollout status deployment/backend

kubectl apply -f k8s/hpa.yaml              # autoscaling, 2-10 pods
kubectl get hpa
kubectl delete -f k8s/                     # clean up
```

Once the HPA is applied, it controls the replica count and overrides `kubectl scale`.
It needs **metrics-server**, and OrbStack may not ship with it. If `kubectl top pods` fails, install it with:
`kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`
(on local clusters you may also need to add the `--kubelet-insecure-tls` arg to its Deployment).
