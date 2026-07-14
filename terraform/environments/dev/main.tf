module "vpc" {
  source = "../../modules/vpc"

  vpc_name             = var.vpc_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}


module "security_groups" {
  source        = "../../modules/security-groups"
  name          = var.name
  description   = var.description
  vpc_id        = module.vpc.vpc_id
  ingress_rules = var.ingress_rules
  egress_rules  = var.egress_rules

}