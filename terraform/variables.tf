variable "project_name" {
  description = "Nombre del proyecto."
  type        = string
  default     = "tutoria-academico-ia-admin-ti"
}

variable "project_path" {
  description = "Ruta objetivo del proyecto en la VPS."
  type        = string
  default     = "/srv/tutoria-academico"
}

variable "ssh_user" {
  description = "Usuario SSH previsto para administrar la VPS."
  type        = string
  default     = "deploy"
}

variable "vps_ip" {
  description = "IP publica o privada de la VPS. Placeholder documental."
  type        = string
  default     = "0.0.0.0"
}

variable "app_port" {
  description = "Puerto previsto para exponer la aplicacion."
  type        = number
  default     = 8088
}

variable "backup_path" {
  description = "Ruta prevista para almacenar backups en la VPS."
  type        = string
  default     = "/srv/tutoria-academico/backups"
}
