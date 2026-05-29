import { r2Client, R2_BUCKET } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = formData.get('folder') as string // 'pets/avatars' or 'pets/covers'
  const userId = formData.get('userId') as string

  if (!file || !folder || !userId) {
    return NextResponse.json(
      { error: 'Missing file, folder, or userId' },
      { status: 400 }
    )
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer = new Uint8Array(arrayBuffer)

    // Resize and compress based on folder type
    if (folder === 'pets/avatars') {
      // Avatar: square 400x400
      buffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer()
    } else if (folder === 'pets/covers') {
      // Cover: landscape 1200x600
      buffer = await sharp(buffer)
        .resize(1200, 600, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer()
    } else {
      // Default compression
      buffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer()
    }

    // Generate safe filename with timestamp
    const timestamp = Date.now()
    const safeFilename = `${timestamp}`
    const key = `${folder}/${userId}/${safeFilename}.webp`

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      ACL: 'public-read',
    })

    await r2Client.send(command)

    // Return public URL
    const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-5376365e3b524017bb827a73b31f2241.r2.dev'
    const publicUrl = `${baseUrl}/${key}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload error:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
