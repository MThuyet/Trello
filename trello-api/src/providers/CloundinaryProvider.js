import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '~/config/environment'

// cấu hình cloudinary, sử dụng v2
// https://cloudinary.com/blog/node_js_file_upload_to_a_local_server_or_to_the_cloud#step_2_set_up_file_uploads_to_cloudinary
const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

// khởi tạo function thực hiện upload file lên cloudinary
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    // tạo ra luồng stream upload lên cloudinary
    const stream = cloudinaryV2.uploader.upload_stream({ folder: folderName }, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })

    // Thực hiện upload luông stream bằng lib streamifier
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

export const CloundinaryProvider = { streamUpload }
