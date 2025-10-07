# Quick Redeploy Guide

## One-Command Full Redeploy (Build + Deploy + Restart)

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger" && \
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main -ldflags="-s -w" -trimpath . && \
tar -czf deploy.tar.gz main static/ && \
scp deploy.tar.gz root@64.227.116.250:/root/ && \
ssh root@64.227.116.250 "cd /root && tar -xzf deploy.tar.gz && pkill -9 -f main && sleep 1 && export REDIS_URL='redis://:mBfBX69uIPwZCP7qdJnmXatICVz5hnK72o+YQxPBVAk=@localhost:6379' && nohup ./main > app.log 2>&1 &"
```

## Check Logs

```bash
ssh root@64.227.116.250 "tail -f /root/app.log"
```

## Check if Running

```bash
ssh root@64.227.116.250 "ss -tulpn | grep 8080"
```

## Static Files Only (No Go Build)

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger" && \
tar -czf deploy.tar.gz static/ && \
scp deploy.tar.gz root@64.227.116.250:/root/ && \
ssh root@64.227.116.250 "cd /root && tar -xzf deploy.tar.gz"
```

## Server Details

- **Host**: 64.227.116.250
- **Redis**: localhost:6379 (password: mBfBX69uIPwZCP7qdJnmXatICVz5hnK72o+YQxPBVAk=)
- **Port**: 8080
- **Domain**: https://kaminskyi.chat/
