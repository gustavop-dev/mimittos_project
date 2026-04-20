import { api } from './http'
import type { MediaUploadResponse } from '../types'

export const mediaService = {
  uploadImage: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('media_type', 'huella_image')
    return api
      .post<MediaUploadResponse>('/media/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  uploadAudio: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('media_type', 'audio')
    return api
      .post<MediaUploadResponse>('/media/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
