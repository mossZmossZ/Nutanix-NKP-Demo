#!/bin/bash
set -e

# Create user with provided password
useradd -m -s /bin/bash user
echo "user:${USER_PASSWORD}" | chpasswd
usermod -aG sudo,docker user
echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure SSH — enable password auth
# Append overrides at the end (takes precedence over earlier lines and conf.d files)
cat >> /etc/ssh/sshd_config <<'SSHCFG'

# Lab overrides
PasswordAuthentication yes
ChallengeResponseAuthentication no
PermitRootLogin no
ListenAddress 0.0.0.0
SSHCFG
# Disable any conf.d files that might override password auth
find /etc/ssh/sshd_config.d/ -type f -exec sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/gI' {} + 2>/dev/null || true
ssh-keygen -A
service ssh start

# Enable IP forwarding so DinD containers can route packets out
sysctl -w net.ipv4.ip_forward=1 || true

# Accept all forwarded packets — required for DinD port bindings to work
iptables -P FORWARD ACCEPT || true

# Start Docker daemon:
#   --storage-driver vfs   : overlay2 fails in nested containers (no nested overlay)
#   --userland-proxy=false : use pure iptables DNAT instead of docker-proxy process
#                            required for host → container → DinD container port chain to work
dockerd --storage-driver vfs --userland-proxy=false &>/var/log/dockerd.log &
for i in $(seq 1 30); do docker info &>/dev/null && break || sleep 1; done

# Write code-server config — base-path set here, not as CLI flag (CLI flag unsupported)
mkdir -p /home/user/.config/code-server
cat > /home/user/.config/code-server/config.yaml <<EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${USER_PASSWORD}
cert: false
base-path: /lab/slot${LAB_SLOT}/
EOF
chown -R user:user /home/user/.config

# Start code-server as the lab user
su - user -c "code-server" &

# Keep container running
tail -f /dev/null
