terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# ============================================
# APPLICATION SERVER DROPLET
# ============================================
resource "digitalocean_droplet" "app_server" {
  image    = "ubuntu-22-04-x64"
  name     = "kaminskyi-messenger-${var.environment}"
  region   = var.region
  size     = var.app_droplet_size  # s-2vcpu-4gb or higher
  ssh_keys = [var.ssh_key_id]

  user_data = templatefile("${path.module}/app-setup.sh", {
    turn_server_ip = digitalocean_reserved_ip.turn_ip.ip_address
    turn_username  = var.turn_username
    turn_password  = var.turn_password
    redis_password = var.redis_password
    environment    = var.environment
  })

  tags = ["messenger-app", var.environment, "webrtc"]

  monitoring = true
  ipv6       = true

  # Wait for TURN server to be ready
  depends_on = [digitalocean_droplet.turn_server]
}

# Reserved IP for Application Server
resource "digitalocean_reserved_ip" "app_ip" {
  region = var.region
}

resource "digitalocean_reserved_ip_assignment" "app_ip_assignment" {
  ip_address = digitalocean_reserved_ip.app_ip.ip_address
  droplet_id = digitalocean_droplet.app_server.id
}

# ============================================
# TURN SERVER DROPLET
# ============================================
resource "digitalocean_droplet" "turn_server" {
  image    = "ubuntu-22-04-x64"
  name     = "kaminskyi-turn-${var.environment}"
  region   = var.region
  size     = var.turn_droplet_size  # s-1vcpu-2gb is sufficient
  ssh_keys = [var.ssh_key_id]

  user_data = templatefile("${path.module}/turn-setup.sh", {
    turn_username = var.turn_username
    turn_password = var.turn_password
    environment   = var.environment
  })

  tags = ["turn-server", var.environment, "webrtc"]

  monitoring = true
  ipv6       = true
}

# Reserved IP for TURN Server
resource "digitalocean_reserved_ip" "turn_ip" {
  region = var.region
}

resource "digitalocean_reserved_ip_assignment" "turn_ip_assignment" {
  ip_address = digitalocean_reserved_ip.turn_ip.ip_address
  droplet_id = digitalocean_droplet.turn_server.id
}

# ============================================
# FIREWALL FOR APPLICATION SERVER
# ============================================
resource "digitalocean_firewall" "app_firewall" {
  name = "kaminskyi-app-firewall-${var.environment}"

  droplet_ids = [digitalocean_droplet.app_server.id]

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"]
  }

  # WebSocket (if using separate port)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "8080"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Redis (only from app server)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "6379"
    source_addresses = ["${digitalocean_droplet.app_server.ipv4_address}/32"]
  }

  # Allow all outbound
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# ============================================
# FIREWALL FOR TURN SERVER
# ============================================
resource "digitalocean_firewall" "turn_firewall" {
  name = "kaminskyi-turn-firewall-${var.environment}"

  droplet_ids = [digitalocean_droplet.turn_server.id]

  # TURN TCP (3478)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3478"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # TURN UDP (3478)
  inbound_rule {
    protocol         = "udp"
    port_range       = "3478"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # TURN TLS (5349)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "5349"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # RTP/RTCP Range (49152-65535)
  inbound_rule {
    protocol         = "udp"
    port_range       = "49152-65535"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"]
  }

  # HTTP for Let's Encrypt
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS for Let's Encrypt
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# ============================================
# LOAD BALANCER (Optional - for scaling)
# ============================================
# Uncomment when you need to scale horizontally
# resource "digitalocean_loadbalancer" "app_lb" {
#   name   = "kaminskyi-messenger-lb-${var.environment}"
#   region = var.region
#
#   forwarding_rule {
#     entry_port     = 443
#     entry_protocol = "https"
#
#     target_port     = 8080
#     target_protocol = "http"
#
#     certificate_name = digitalocean_certificate.app_cert.name
#   }
#
#   forwarding_rule {
#     entry_port     = 80
#     entry_protocol = "http"
#
#     target_port     = 8080
#     target_protocol = "http"
#   }
#
#   healthcheck {
#     port     = 8080
#     protocol = "http"
#     path     = "/health"
#   }
#
#   droplet_ids = [digitalocean_droplet.app_server.id]
# }
