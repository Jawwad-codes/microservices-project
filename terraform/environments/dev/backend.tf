terraform {
  backend "s3" {
    bucket         = "jawwad-microservices-tf-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
  }
}