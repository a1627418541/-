import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from '@/lib/config'

/**
 * Cloudflare R2 Service
 * R2 is S3-compatible object storage for persisting generated images.
 */
class R2Service {
  private client: S3Client | null = null
  private bucket: string
  private publicUrl: string

  constructor() {
    this.bucket = config.r2BucketName
    this.publicUrl = config.r2PublicUrl

    if (config.r2Endpoint && config.r2AccessKeyId && config.r2SecretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: config.r2Endpoint,
        credentials: {
          accessKeyId: config.r2AccessKeyId,
          secretAccessKey: config.r2SecretAccessKey,
        },
        forcePathStyle: true,
      })
    }
  }

  isConfigured(): boolean {
    return this.client !== null
  }

  /**
   * Upload image buffer to R2
   * @param key - Object key (path in bucket)
   * @param buffer - Image buffer
   * @param contentType - MIME type
   * @returns Public URL of the uploaded object
   */
  async uploadImage(key: string, buffer: Buffer, contentType = 'image/png'): Promise<string> {
    if (!this.client) {
      throw new Error('R2 not configured')
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )

    return `${this.publicUrl}/${key}`
  }
}

export const r2Service = new R2Service()
