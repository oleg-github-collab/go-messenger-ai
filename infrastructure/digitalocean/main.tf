terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }

  # Store state in DigitalOcean Spaces (S3-compatible)
  # backend "s3" {
  #   endpoint                    = "fra1.digitaloceanspaces.com"
  #   region                      = "us-east-1" # Required but not used
  #   bucket                      = "kaminskyi-terraform-state"
  #   key                         = "messenger/terraform.tfstate"
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  # }
}

provider "digitalocean" {
  token = var.do_token
}

# TURN Server Droplet
resource "digitalocean_droplet" "turn_server" {
  image    = "ubuntu-22-04-x64"
  name     = "kaminskyi-turn-${var.environment}"
  region   = var.region
  size     = var.droplet_size
  ssh_keys = [var.ssh_key_fingerprint]

  # Cloud-init user data
  user_data = templatefile("${path.module}/turn-setup.sh", {
    turn_username = var.turn_username
    turn_password = var.turn_password
    environment   = var.environment
  })

  tags = ["turn-server", var.environment, "webrtc"]

  # Enable monitoring
  monitoring = true

  # Enable IPv6
  ipv6 = true
}

# Firewall for TURN Server
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

  # SSH (restricted to your IP - update this!)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"] # TODO: Restrict to your IP
  }

  # HTTPS for Let's Encrypt
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP for Let's Encrypt
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
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

# Reserved IP for TURN server (optional but recommended)
resource "digitalocean_reserved_ip" "turn_ip" {
  region = var.region
}

resource "digitalocean_reserved_ip_assignment" "turn_ip_assignment" {
  ip_address = digitalocean_reserved_ip.turn_ip.ip_address
  droplet_id = digitalocean_droplet.turn_server.id
}
