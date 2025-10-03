output "app_server_ip" {
  description = "Application server public IP address"
  value       = digitalocean_reserved_ip.app_ip.ip_address
}

output "turn_server_ip" {
  description = "TURN server public IP address"
  value       = digitalocean_reserved_ip.turn_ip.ip_address
}

output "app_server_id" {
  description = "Application server droplet ID"
  value       = digitalocean_droplet.app_server.id
}

output "turn_server_id" {
  description = "TURN server droplet ID"
  value       = digitalocean_droplet.turn_server.id
}

output "redis_password" {
  description = "Redis password (sensitive)"
  value       = var.redis_password != "" ? var.redis_password : "Check /root/redis-password.txt on app server"
  sensitive   = true
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

output "deployment_info" {
  description = "Deployment information"
  sensitive   = true
  value = <<-EOT

  ============================================
  KAMINSKYI MESSENGER - DEPLOYMENT INFO
  ============================================

  Application Server:
    IP: ${digitalocean_reserved_ip.app_ip.ip_address}
    SSH: ssh root@${digitalocean_reserved_ip.app_ip.ip_address}
    Info: cat /root/messenger-server-info.txt

  TURN Server:
    IP: ${digitalocean_reserved_ip.turn_ip.ip_address}
    SSH: ssh root@${digitalocean_reserved_ip.turn_ip.ip_address}
    Info: cat /root/turn-server-info.txt

  TURN Configuration:
    URLs:
      - turn:${digitalocean_reserved_ip.turn_ip.ip_address}:3478?transport=udp
      - turn:${digitalocean_reserved_ip.turn_ip.ip_address}:3478?transport=tcp
      - turns:${digitalocean_reserved_ip.turn_ip.ip_address}:5349?transport=tcp
    Username: ${var.turn_username}
    Password: ${var.turn_password}

  Next Steps:
    1. Point your domain A record to: ${digitalocean_reserved_ip.app_ip.ip_address}
    2. Point turn subdomain to: ${digitalocean_reserved_ip.turn_ip.ip_address}
    3. Deploy app: cd .. && ./deploy.sh
    4. Setup SSL: ssh to servers and run certbot

  ============================================
  EOT
}
