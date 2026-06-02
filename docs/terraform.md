# Terraform e Infrastructure as Code

## Que es Infrastructure as Code

Infrastructure as Code (IaC) es una practica para describir infraestructura con archivos versionados en lugar de configurarla solo de forma manual.

Sus ventajas principales son:

- trazabilidad
- repetibilidad
- documentacion operativa
- menor dependencia de memoria manual

## Alcance aplicado al proyecto

En `TutorIA Academico`, Terraform se usa en Sprint 12 como evidencia minima y segura de IaC.

En esta etapa:

- la infraestructura principal ya existe
- la VPS ya esta en produccion
- el despliegue real ocurre con `docker-compose` y GitHub Actions

Por eso Terraform se usa para documentar y parametrizar:

- la ruta del proyecto
- la IP de la VPS
- el dominio publico
- el puerto interno
- la URL interna
- la URL publica
- la ruta de backups
- el archivo Compose
- el proveedor de CI/CD

## Infraestructura existente

La infraestructura real del proyecto hoy se compone de:

- una VPS existente
- `docker-compose.prod.yml`
- Nginx ya configurado
- despliegue por GitHub Actions via SSH
- persistencia de base de datos, media y backups

Terraform no recrea estos componentes en este sprint.

## Razon del enfoque seguro

Existe otro sistema en produccion en la misma VPS: `LIS Los Encinos`.

Para evitar riesgos:

- no se usan providers cloud
- no se crean recursos reales
- no se ejecutan provisioners remotos
- no se usa SSH desde Terraform
- no se toca Nginx real
- no se tocan certificados

Este enfoque permite defender IaC sin poner en riesgo produccion.

## Variables principales

Las variables mas importantes son:

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

## Outputs utiles

Terraform expone outputs como:

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

Estos outputs ayudan a alinear IaC con operacion real y documentacion.

## Relacion con VPS, Docker Compose, CI/CD y backups

- La VPS sigue siendo existente y administrada con cuidado.
- Docker Compose sigue siendo el mecanismo operativo de despliegue.
- GitHub Actions sigue haciendo el deploy automatico.
- Terraform documenta los mismos valores no sensibles usados por despliegue y operacion.
- `backup_path` queda representado para documentar la continuidad operativa.

## Ejecucion basica

Desde `terraform/`:

```bash
terraform init
terraform validate
terraform plan -var-file="terraform.tfvars.example"
terraform output
```

## Seguridad

- no se guardan secretos en Terraform
- no se debe subir un `terraform.tfvars` real si contiene datos sensibles
- solo se versiona `terraform.tfvars.example`

## Mejora futura

En una siguiente etapa, Terraform podria crecer para usar un provider real y crear:

- VPS
- DNS
- reglas de firewall
- recursos de backup

Eso se haria solo cuando exista un entorno aislado o una estrategia segura para no afectar produccion.
