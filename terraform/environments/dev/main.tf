module "vpc" {
  source = "../../modules/vpc"

  vpc_name             = var.vpc_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "alb_sgs" {
  source = "../../modules/security-groups"

  name          = "alb-sgs"
  description   = "ALB Security Group"
  vpc_id        = module.vpc.vpc_id
  ingress_rules = var.alb_ingress_rules
  egress_rules  = var.default_egress_rules
}

module "eks_node_sg" {
  source = "../../modules/security-groups"

  name          = "eks-node-sg"
  description   = "EKS Worker Node Security Group"
  vpc_id        = module.vpc.vpc_id
  ingress_rules = var.eks_node_ingress_rules
  egress_rules  = var.default_egress_rules
}

module "eks_cluster_sg" {
  source = "../../modules/security-groups"

  name          = "eks-cluster-sg"
  description   = "EKS Cluster Security Group"
  vpc_id        = module.vpc.vpc_id
  ingress_rules = []
  egress_rules  = var.default_egress_rules
}

module "rds_sg" {
  source = "../../modules/security-groups"

  name          = "rds-sg"
  description   = "RDS Security Group"
  vpc_id        = module.vpc.vpc_id
  ingress_rules = var.rds_ingress_rules
  egress_rules  = var.default_egress_rules
}



module "iam" {

  source = "../../modules/iam"

  project_name = var.project_name
}


module "ecr" {
  source = "../../modules/ecr"

  repositories         = var.repositories
  image_tag_mutability = var.image_tag_mutability
}


module "s3" {
  source = "../../modules/s3"

  bucket_name   = var.bucket_name
  force_destroy = var.force_destroy
  tags          = var.tags
}

module "cloudfront" {

  source = "../../modules/cloudfront"

  bucket_name        = module.s3.bucket_name
  bucket_arn         = module.s3.bucket_arn
  bucket_domain_name = module.s3.bucket_domain_name

  tags = {
    Environment = "dev"
    Project     = "Microservices"
  }
}


module "rds" {

  source = "../../modules/rds"

  identifier = "microservices-db"

  db_name = var.db_name

  username = var.db_username

  password = var.db_password

  private_subnet_ids = module.vpc.private_subnets

  vpc_security_group_ids = [
    module.rds_sg.security_group_id
  ]

  tags = {
    Environment = "dev"
    Project     = "Microservices"
  }
}



module "eks" {

  source = "../../modules/eks"

  cluster_name = var.cluster_name

  cluster_version = var.cluster_version

  cluster_role_arn = module.iam.cluster_role_arn

  node_role_arn = module.iam.node_role_arn

  subnet_ids = module.vpc.private_subnets

  security_group_ids = [
    module.eks_node_sg.security_group_id
  ]

  instance_types = var.instance_types

  desired_size = 2

  min_size = 2

  max_size = 2

  tags = {
    Environment = "dev"
    Project     = "Microservices"
  }
}