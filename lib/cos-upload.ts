// 腾讯云COS文件上传工具
interface UploadConfig {
  bucket: string
  region: string
  secretId: string
  secretKey: string
}

interface UploadResult {
  success: boolean
  url?: string
  key?: string
  message?: string
}

class COSUploader {
  private config: UploadConfig
  private baseUrl: string

  constructor(config: UploadConfig) {
    this.config = config
    this.baseUrl = `https://${config.bucket}.cos.${config.region}.myqcloud.com`
  }

  /**
   * 获取上传签名
   */
  private async getUploadSignature(key: string): Promise<any> {
    try {
      // 调用云函数获取签名
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cos-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      })

      if (!response.ok) {
        throw new Error('获取上传签名失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取签名失败:', error)
      throw error
    }
  }

  /**
   * 上传单个文件
   */
  async uploadFile(file: File, folder: string = 'uploads'): Promise<UploadResult> {
    try {
      // 生成文件名
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2)
      const ext = file.name.split('.').pop()
      const key = `${folder}/${timestamp}_${random}.${ext}`

      // 获取上传签名
      const signData = await this.getUploadSignature(key)

      // 使用FormData上传
      const formData = new FormData()
      formData.append('key', key)
      formData.append('policy', signData.policy)
      formData.append('Signature', signData.signature)
      formData.append('x-cos-security-token', signData.token)
      formData.append('file', file)

      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const fileUrl = `${this.baseUrl}/${key}`

      return {
        success: true,
        url: fileUrl,
        key: key,
      }

    } catch (error) {
      console.error('文件上传失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '上传失败',
      }
    }
  }

  /**
   * 上传多个文件
   */
  async uploadFiles(files: File[], folder: string = 'uploads'): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    // 并行上传，限制并发数
    const concurrencyLimit = 3
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map(file => this.uploadFile(file, folder))
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      // 调用云函数删除文件
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cos-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      })

      return response.ok
    } catch (error) {
      console.error('删除文件失败:', error)
      return false
    }
  }

  /**
   * 压缩图片
   */
  private async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // 限制最大尺寸
        const maxWidth = 1200
        const maxHeight = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 上传并压缩图片
   */
  async uploadCompressedImage(file: File, folder: string = 'images'): Promise<UploadResult> {
    try {
      // 检查文件大小（超过2MB才压缩）
      if (file.size > 2 * 1024 * 1024) {
        const compressedFile = await this.compressImage(file, 0.7)
        return await this.uploadFile(compressedFile, folder)
      }

      return await this.uploadFile(file, folder)
    } catch (error) {
      console.error('压缩上传失败:', error)
      // 降级为普通上传
      return await this.uploadFile(file, folder)
    }
  }
}

// 单例模式
let cosUploader: COSUploader | null = null

export function getCOSUploader(): COSUploader {
  if (!cosUploader) {
    cosUploader = new COSUploader({
      bucket: process.env.NEXT_PUBLIC_COS_BUCKET!,
      region: process.env.NEXT_PUBLIC_COS_REGION!,
      secretId: process.env.TENCENT_SECRET_ID!,
      secretKey: process.env.TENCENT_SECRET_KEY!,
    })
  }
  return cosUploader
}

export default COSUploader