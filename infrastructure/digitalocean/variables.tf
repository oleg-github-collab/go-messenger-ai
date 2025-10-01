variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "ssh_key_fingerprint" {
  description = "SSH Key Fingerprint for Droplet access"
  type        = string
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

variable "droplet_size" {
  description = "Droplet size for TURN server"
  type        = string
  default     = "s-2vcpu-4gb" # Enough for 20 participants
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
