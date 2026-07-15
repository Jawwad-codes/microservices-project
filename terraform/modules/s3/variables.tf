variable "bucket_name" {
  description = "Frontend S3 bucket name"
  type        = string
}

variable "force_destroy" {
  description = "Delete bucket even if it contains objects"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags for S3 bucket"
  type        = map(string)
  default     = {}
}