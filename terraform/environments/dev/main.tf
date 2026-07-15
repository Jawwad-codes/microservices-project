module "vpc" {
  source = "../../modules/vpc"

  vpc_name             = var.vpc_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "alb_sg" {
  source = "../../modules/security-groups"

  name          = "alb-sg"
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

  repositories          = var.repositories
  image_tag_mutability  = var.image_tag_mutability
}