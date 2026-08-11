/**
 * 커버 사진처럼 큰 이미지를 올리기 전에 줄인다.
 *
 * 커버는 화면 폭 전체에 깔리지만 원본(요즘 폰 사진은 4000px 넘음) 그대로 올릴 이유는 없다.
 * 가로 maxWidth 로 줄이고 JPEG 로 다시 인코딩하면 용량이 보통 1/10 아래로 떨어진다.
 * 실패하거나 이미 충분히 작으면 원본 파일을 그대로 돌려주므로 호출부는 결과만 쓰면 된다.
 */
export async function downscaleImage(file, { maxWidth = 1920, quality = 0.82 } = {}) {
  // 움직이는 GIF 는 다시 그리면 첫 장면만 남아 버리므로 건드리지 않는다.
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  if (bitmap.width <= maxWidth) {
    bitmap.close?.()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = maxWidth
  canvas.height = Math.round((bitmap.height * maxWidth) / bitmap.width)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) return file

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
}
