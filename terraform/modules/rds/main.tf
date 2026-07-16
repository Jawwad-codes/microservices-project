resource "aws_db_subnet_group" "this" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = local.common_tags
}

resource "aws_db_instance" "this" {

  identifier = var.identifier

  engine         = var.engine
  engine_version = var.engine_version

  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = var.storage_type

  db_name  = var.db_name
  username = var.username
  password = var.password

  db_subnet_group_name = aws_db_subnet_group.this.name

  vpc_security_group_ids = var.vpc_security_group_ids

  publicly_accessible = var.publicly_accessible

  multi_az = var.multi_az

  backup_retention_period = var.backup_retention_period

  skip_final_snapshot = var.skip_final_snapshot

  storage_encrypted = true

  deletion_protection = false

  apply_immediately = true

  tags = local.common_tags
}