import 'dotenv/config'

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,

  LOCAL_DEV_APP_HOST: process.env.LOCAL_DEV_APP_HOST,
  LOCAL_DEV_APP_PORT: process.env.LOCAL_DEV_APP_PORT,

  BUILD_MODE: process.env.BUILD_MODE,
  PORT: process.env.PORT,
  AUTHOR: process.env.AUTHOR,

  WEBSITE_DOMAIN_DEVELOPMENT: process.env.WEBSITE_DOMAIN_DEVELOPMENT,
  WEBSITE_DOMAIN_PRODUCTION: process.env.WEBSITE_DOMAIN_PRODUCTION,

  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,

  RESEND_API_KEY: process.env.RESEND_API_KEY,

  ACCESS_TOKEN_SIGNATURE: process.env.ACCESS_TOKEN_SIGNATURE,
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE,

  REFRESH_TOKEN_SIGNATURE: process.env.REFRESH_TOKEN_SIGNATURE,
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}

const requiredEnvVars = [
  'MONGODB_URI', // Bắt buộc: kết nối database
  'DATABASE_NAME', // Bắt buộc: tên database
  'ACCESS_TOKEN_SIGNATURE', // Bắt buộc: ký JWT access token
  'REFRESH_TOKEN_SIGNATURE', // Bắt buộc: ký JWT refresh token
]

// Kiểm tra các biến môi trường bắt buộc
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`)
  })
  console.error('Please set these variables in your .env file')
  process.exit(1) // Dừng server ngay lập tức
}
