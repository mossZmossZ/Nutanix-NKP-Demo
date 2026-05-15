#!/bin/bash
set -e

# ─── Network diagnostics — log before anything else ────────────────────────────
diag()  { echo "[diag] $(date '+%H:%M:%S') $*"; }
check() { printf "  %-40s " "$1 …"; shift; if "$@" &>/dev/null; then echo "OK"; else echo "FAIL"; fi; }

diag "=== Network diagnostics for slot=${LAB_SLOT:-?} ==="

diag "IPv4 interfaces:"
ip -4 addr show | grep -E '^\s+inet ' | while read -r line; do echo "         $line"; done
echo

diag "Default route:"
ip route show default || echo "         (none)"
echo

diag "DNS resolution:"
check "resolve google.com"    nslookup -timeout=3 google.com
check "resolve docker.io"    nslookup -timeout=3 docker.io
echo

diag "Outbound connectivity:"
check "ping 8.8.8.8"         ping -c1 -W2 8.8.8.8
check "curl google.com:80"   curl -fsI --connect-timeout 3 http://google.com
echo

diag "IP forwarding:"
echo "         $(sysctl -n net.ipv4.ip_forward 2>/dev/null || echo unknown)"
echo

diag "iptables FILTER table (FORWARD chain):"
iptables -L FORWARD -n -v --line-numbers 2>/dev/null | head -20 || echo "         (iptables not available)"
echo

diag "iptables NAT table (rules):"
iptables -t nat -L -n -v --line-numbers 2>/dev/null | head -20 || echo "         (iptables not available)"
echo

# ─── Create user ───────────────────────────────────────────────────────────────
useradd -m -s /bin/bash user
echo "user:${USER_PASSWORD}" | chpasswd
usermod -aG sudo,docker user
echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ─── Configure SSH ─────────────────────────────────────────────────────────────
cat >> /etc/ssh/sshd_config <<'SSHCFG'

# Lab overrides
PasswordAuthentication yes
ChallengeResponseAuthentication no
PermitRootLogin no
ListenAddress 0.0.0.0
SSHCFG
find /etc/ssh/sshd_config.d/ -type f -exec sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/gI' {} + 2>/dev/null || true
ssh-keygen -A
service ssh start

# ─── Enable IP forwarding (required for DinD) ──────────────────────────────────
sysctl -w net.ipv4.ip_forward=1 || true

# Accept all forwarded packets — required for DinD port bindings to work
iptables -P FORWARD ACCEPT || true

# ─── Start Docker daemon (DinD) ────────────────────────────────────────────────
diag "Starting Docker daemon (DinD) …"
dockerd --storage-driver vfs --userland-proxy=false &>/var/log/dockerd.log &
for i in $(seq 1 30); do docker info &>/dev/null && break || sleep 1; done

# ─── DinD network checks ───────────────────────────────────────────────────────
diag "Docker daemon (DinD):"
check "docker info"           docker info
check "docker pull nginx:alpine" docker pull nginx:alpine
echo

diag "Run test container with port binding:"
docker rm -f diag-test 2>/dev/null || true
docker run -d --name diag-test -p 9999:80 nginx:alpine 2>/dev/null || true
sleep 2
check "curl inner:9999"      curl -fsI --connect-timeout 2 http://localhost:9999
DIP=$(docker inspect -f '{{.NetworkSettings.IPAddress}}' diag-test 2>/dev/null || echo '')
check "curl <inner-ip>:80"   curl -fsI --connect-timeout 2 "http://${DIP:-127.0.0.1}:80"
docker rm -f diag-test 2>/dev/null || true
echo

# ─── Write code-server config ──────────────────────────────────────────────────
mkdir -p /home/user/.config/code-server
cat > /home/user/.config/code-server/config.yaml <<EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${USER_PASSWORD}
cert: false
base-path: /lab/${LAB_SLOT}
EOF
chown -R user:user /home/user/.config

# ─── Start code-server ─────────────────────────────────────────────────────────
su - user -c "code-server" &

sleep 3  # wait for code-server to finish starting up

# ─── Service liveness checks ───────────────────────────────────────────────────
diag "Service liveness:"
check "SSH on port 22"       nc -z localhost 22
check "code-server on :8080" curl -fsI --connect-timeout 3 http://localhost:8080/login
check "sshd process"         pgrep -f sshd
echo

diag "Listening ports:"
ss -tlnp 2>/dev/null | grep -v '127.0.0.1' || netstat -tlnp 2>/dev/null | grep -v '127.0.0.1'
echo

diag "=== Diagnostics complete ==="

# Keep container running
tail -f /dev/null
