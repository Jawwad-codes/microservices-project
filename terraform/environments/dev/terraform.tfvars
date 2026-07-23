vpc_name = "dev-vpc"

vpc_cidr = "10.0.0.0/16"

availability_zones = [
  "ap-south-1a",
  "ap-south-1b"
]

public_subnet_cidrs = [
  "10.0.1.0/24",
  "10.0.2.0/24"
]

private_subnet_cidrs = [
  "10.0.11.0/24",
  "10.0.12.0/24"
]


alb_ingress_rules = [
  {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  },
  {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
]

eks_node_ingress_rules = [
  {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  },
  {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  },
  {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
]

rds_ingress_rules = [
  {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
]

default_egress_rules = [
  {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
]

project_name = "microservices"


repositories = [
  "api-gateway",
  "user-service",
  "order-service",
  "payment-service",
  "notification-service",
  "product-service"
]

image_tag_mutability = "MUTABLE"


bucket_name = "jawwad-microservices-frontend-2026"

force_destroy = true

tags = {
  Environment = "dev"
  Project     = "Microservices"
}


db_name = "microservices"

db_username = "postgres"



cluster_name = "microservices-dev"

cluster_version = "1.33"

instance_types = ["t3.small"]

desired_size = 2

min_size = 2

max_size = 2

capacity_type = "SPOT"

disk_size = 20