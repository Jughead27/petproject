import { r2Client, R2_BUCKET } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

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
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate safe filename with timestamp
    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const safeFilename = `${timestamp}`
    const key = `${folder}/${userId}/${safeFilename}.${ext}`

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await r2Client.send(command)

    // Return public URL
    const publicUrl = `${process.env.CLOUDFLARE_R2_ENDPOINT}/${R2_BUCKET}/${key}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload error:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
