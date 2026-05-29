import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'petproject-media'

export async function deleteFromR2(fileUrl: string): Promise<void> {
  if (!fileUrl) return

  try {
    // Extract key from public URL
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1) // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('Failed to delete file from R2:', {
      fileUrl,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
