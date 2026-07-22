variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  type = string
  default = "1.33"
}

variable "cluster_role_arn" {
  type = string
}

variable "node_role_arn" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "instance_types" {
  type = list(string)
}

variable "capacity_type" {
  type = string
  default = "SPOT"
}

variable "disk_size" {
  type = number
  default = 20
}

variable "desired_size" {
  type = number
  default = 2
}

variable "min_size" {
  type = number
  default = 2
}

variable "max_size" {
  type = number
  default = 2
}

variable "tags" {
  type = map(string)
  default = {}
}