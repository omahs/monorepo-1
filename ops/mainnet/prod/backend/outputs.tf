output "cartographer-routers-service-endpoint" {
  value = module.cartographer-routers-lambda-cron.lambda_cron_service_name
}

output "cartographer-transfers-service-endpoint" {
  value = module.cartographer-transfers-lambda-cron.lambda_cron_service_name
}

output "cartographer-messages-service-endpoint" {
  value = module.cartographer-messages-lambda-cron.lambda_cron_service_name
}

output "cartographer-roots-service-endpoint" {
  value = module.cartographer-roots-lambda-cron.lambda_cron_service_name
}

output "postgrest-dns" {
  value = module.postgrest.dns_name
}

output "postgrest-service-endpoint" {
  value = module.postgrest.service_endpoint
}

output "db-instance-endpoint" {
  value = module.cartographer_db.db_instance_endpoint
}

output "db-instance-fixed-address" {
  value = module.cartographer_db.db_instance_fixed_address
}

