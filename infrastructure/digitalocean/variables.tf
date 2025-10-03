variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "ssh_key_id" {
  description = "SSH Key ID for Droplet access"
  type        = number
}

variable "environment" {
  description = "Environment (production, staging)"
  type        = string
  default     = "production"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "fra1" # Frankfurt - closest to Ukraine
}

variable "app_droplet_size" {
  description = "Droplet size for application server"
  type        = string
  default     = "s-2vcpu-4gb" # Optimized for WebRTC + SFU
}

variable "turn_droplet_size" {
  description = "Droplet size for TURN server"
  type        = string
  default     = "s-1vcpu-2gb" # Sufficient for TURN relay
}

variable "turn_username" {
  description = "TURN server username"
  type        = string
  sensitive   = true
}

variable "turn_password" {
  description = "TURN server password"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password for session management"
  type        = string
  sensitive   = true
  default     = "" # Will be auto-generated if not provided
}
