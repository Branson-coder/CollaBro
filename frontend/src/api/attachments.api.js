import axiosClient from './axiosClient'

export const attachmentsApi = {
  getAll:  (taskId)        => axiosClient.get(`/attachments/${taskId}`),
  upload:  (taskId, file)  => {
    const form = new FormData()
    form.append('file', file)
    return axiosClient.post(`/attachments/${taskId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete:  (attachmentId) => axiosClient.delete(`/attachments/${attachmentId}`),
  fileUrl: (filename)     => `http://localhost:4000/uploads/${filename}`,
}