# GitHub Actions CI/CD Pipeline

This directory contains the GitHub Actions workflow for automated deployment of the Go Messenger application to DigitalOcean.

## Workflow Overview

The `deploy.yml` workflow automatically:

1. **Builds** the Go application for Linux (amd64)
2. **Packages** the binary and static files into a tar.gz archive
3. **Uploads** the package to the production server via SCP
4. **Deploys** by:
   - Stopping the messenger service
   - Backing up the current application
   - Extracting new files to `/opt/messenger/app`
   - Starting the messenger service
5. **Verifies** the deployment with health checks

## Setup Instructions

### 1. Add SSH Private Key to GitHub Secrets

You need to add your SSH private key as a GitHub secret to enable secure deployment.

#### Step 1: Copy your SSH private key

```bash
cat ~/.ssh/messenger_deploy
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`).

#### Step 2: Add the secret to GitHub

1. Go to your GitHub repository: https://github.com/oleg-github-collab/go-messenger-ai
2. Click on **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the entire private key content
6. Click **Add secret**

### 2. Verify Server Configuration

Ensure your DigitalOcean server (157.230.79.144) has:

1. **Systemd service** configured at `/etc/systemd/system/messenger.service`
2. **Application directory** at `/opt/messenger/app`
3. **Backup directory** at `/opt/messenger/backups` (will be created automatically)
4. **SSH access** configured for the root user with the messenger_deploy key

### 3. Trigger Deployment

The workflow triggers automatically on:
- **Push to main branch**: Any commit pushed to the `main` branch
- **Manual trigger**: Via GitHub Actions UI (workflow_dispatch)

#### Manual Deployment

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to DigitalOcean** workflow
3. Click **Run workflow**
4. Select the `main` branch
5. Click **Run workflow**

## Workflow Configuration

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `GO_VERSION` | 1.21 | Go version for building |
| `APP_NAME` | messenger | Application binary name |
| `DEPLOY_PATH` | /opt/messenger | Deployment directory on server |
| `SERVER_USER` | root | SSH user for deployment |
| `SERVER_HOST` | 157.230.79.144 | Production server IP |

### Required Secrets

| Secret | Description | How to obtain |
|--------|-------------|---------------|
| `SSH_PRIVATE_KEY` | SSH private key for server access | From `~/.ssh/messenger_deploy` |

## Deployment Process

### 1. Build Stage
- Checks out the latest code
- Sets up Go 1.21
- Downloads dependencies
- Builds binary with optimizations (`-ldflags="-w -s"`)

### 2. Package Stage
- Creates deployment package directory
- Copies binary and static files
- Creates compressed tar.gz archive

### 3. Upload Stage
- Sets up SSH key from secrets
- Uploads package to `/tmp` on server via SCP

### 4. Deploy Stage
- Stops the messenger service
- Creates timestamped backup in `/opt/messenger/backups/`
- Extracts new files to `/opt/messenger/app/`
- Starts the messenger service
- Cleans up temporary files

### 5. Verify Stage
- Checks systemd service status
- Verifies process is running
- Tests HTTP endpoint (http://localhost:8080/login)
- Shows recent application logs

## Troubleshooting

### Deployment fails with "Permission denied"

**Solution**: Verify the SSH private key is correctly added to GitHub secrets and matches the public key on the server.

```bash
# On server, check authorized_keys
cat ~/.ssh/authorized_keys
```

### Service fails to start

**Solution**: Check the systemd service configuration and logs:

```bash
# On server
systemctl status messenger
journalctl -u messenger -n 50
```

### Binary architecture mismatch

**Solution**: Ensure the server is Linux amd64. The workflow builds with:
```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64
```

### Static files not found

**Solution**: Verify the `static` directory exists in the repository root and is committed to git.

## Rollback Procedure

If a deployment fails, you can rollback to a previous version:

```bash
# SSH into server
ssh -i ~/.ssh/messenger_deploy root@157.230.79.144

# List available backups
ls -la /opt/messenger/backups/

# Stop the service
systemctl stop messenger

# Restore from backup (replace timestamp with desired backup)
cp -r /opt/messenger/backups/20241003_143000/* /opt/messenger/app/

# Start the service
systemctl start messenger

# Verify
systemctl status messenger
```

## Monitoring

### View Deployment Status

1. Go to **Actions** tab in GitHub repository
2. Click on the latest workflow run
3. Expand each step to view detailed logs

### View Application Logs

```bash
# SSH into server
ssh -i ~/.ssh/messenger_deploy root@157.230.79.144

# View real-time logs
journalctl -u messenger -f

# View last 100 lines
journalctl -u messenger -n 100

# View logs from specific time
journalctl -u messenger --since "1 hour ago"
```

## Security Notes

1. **SSH Key Protection**: The SSH private key is stored securely in GitHub Secrets and is never exposed in logs
2. **Key Cleanup**: The SSH key is removed from the runner after deployment (even on failure)
3. **Server Access**: Only the root user with the specific SSH key can deploy
4. **HTTPS**: Consider adding SSL/TLS termination (nginx/caddy) for production

## Next Steps

1. **Add Secrets**: Follow the setup instructions above to add `SSH_PRIVATE_KEY` to GitHub
2. **Test Deployment**: Manually trigger a deployment from GitHub Actions
3. **Monitor**: Watch the first deployment closely in the Actions tab
4. **Configure Alerts**: Set up GitHub Actions status notifications (optional)

## Support

For issues or questions:
- Check the **Actions** tab for deployment logs
- Review the **Troubleshooting** section above
- Check server logs with `journalctl -u messenger`
