# Terraform

## Proposito

Esta carpeta documenta la infraestructura operativa de `TutorIA Academico` usando Terraform de forma segura.

En este sprint, Terraform no crea recursos reales. Se usa para:

- representar la VPS existente
- parametrizar valores operativos del despliegue
- exponer outputs utiles para operacion y documentacion

## Por que no se crea la VPS desde cero

La VPS ya existe y comparte contexto con otro sistema en produccion: `LIS Los Encinos`.

Por seguridad:

- no se usan providers que modifiquen infraestructura real
- no se crean recursos cloud
- no se ejecutan provisioners remotos
- no se toca Nginx real
- no se tocan certificados

## Como ejecutar

Desde la carpeta `terraform/`:

```bash
terraform init
terraform validate
terraform plan -var-file="terraform.tfvars.example"
terraform output
```

Si quieres ver outputs con valores del ejemplo:

```bash
terraform apply -refresh=false -var-file="terraform.tfvars.example"
terraform output
```

Nota:

- esta configuracion no define recursos reales
- el `apply` solo guarda valores en el state local de Terraform
- no debe usarse un `terraform.tfvars` real con secretos dentro del repositorio

## Variables principales

- `project_name`
- `environment`
- `vps_ip`
- `ssh_user`
- `project_path`
- `app_domain`
- `app_port`
- `internal_app_url`
- `public_app_url`
- `backup_path`
- `docker_compose_file`
- `ci_cd_provider`
- `repository_url`

## Outputs generados

- `project_name`
- `environment`
- `vps_ip`
- `ssh_connection`
- `project_path`
- `public_app_url`
- `internal_app_url`
- `healthcheck_url`
- `websocket_url`
- `backup_path`
- `docker_compose_file`
- `deployment_strategy`
- `ci_cd_provider`

## Limitaciones actuales

- no crea VPS
- no crea DNS
- no crea firewall
- no crea certificados
- no ejecuta despliegues
- no interactua con Docker ni con GitHub Actions

## Mejoras futuras

En un escenario posterior, Terraform podria extenderse para:

- crear una VPS desde el provider cloud real
- gestionar DNS del subdominio
- definir reglas de firewall
- modelar almacenamiento y backups
- integrar datos no sensibles del pipeline CI/CD
