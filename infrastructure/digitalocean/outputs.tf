output "turn_server_ip" {
  description = "Public IP address of TURN server"
  value       = digitalocean_reserved_ip.turn_ip.ip_address
}

output "turn_server_ipv6" {
  description = "IPv6 address of TURN server"
  value       = digitalocean_droplet.turn_server.ipv6_address
}

output "turn_server_id" {
  description = "Droplet ID"
  value       = digitalocean_droplet.turn_server.id
}

output "turn_server_status" {
  description = "Droplet status"
  value       = digitalocean_droplet.turn_server.status
}

output "turn_config" {
  description = "TURN server configuration for WebRTC"
  value = {
    urls = [
      "turn:${digitalocean_reserved_ip.turn_ip.ip_address}:3478?transport=udp",
      "turn:${digitalocean_reserved_ip.turn_ip.ip_address}:3478?transport=tcp",
      "turns:${digitalocean_reserved_ip.turn_ip.ip_address}:5349?transport=tcp"
    ]
    username   = var.turn_username
    credential = "*** HIDDEN ***"
  }
  sensitive = true
}

output "dns_records" {
  description = "DNS records to create"
  value = {
    A_record = {
      name  = "turn.kaminskyi.ai"
      value = digitalocean_reserved_ip.turn_ip.ip_address
      type  = "A"
    }
    AAAA_record = {
      name  = "turn.kaminskyi.ai"
      value = digitalocean_droplet.turn_server.ipv6_address
      type  = "AAAA"
    }
  }
}
