variable "repositories" {
  description = "List of ECR repositories"
  type        = list(string)
}

variable "image_tag_mutability" {
  type    = string
  default = "MUTABLE"
}