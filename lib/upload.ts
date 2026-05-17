export async function uploadToR2(
  file: File,
  folder: string, // 'pets/avatars' or 'pets/covers'
  userId: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  formData.append('userId', userId)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const { url } = await response.json()
  return url
}
