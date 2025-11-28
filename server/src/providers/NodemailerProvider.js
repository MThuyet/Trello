const nodemailer = require('nodemailer')
const { env } = require('~/config/environment')

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.ADMIN_EMAIL,
    pass: env.ADMIN_PASSWORD,
  },
})

const sendMail = async (to, subject, htmlContent) => {
  const options = {
    from: env.ADMIN_EMAIL, // địa chỉ admin email dùng để gửi
    to: to, // địa chỉ gửi đến
    subject: subject, // Tiêu đề của mail
    html: htmlContent, // Phần nội dung mail
  }

  // hàm transporter.sendMail() này sẽ trả về cho chúng ta một Promise
  try {
    const result = await transporter.sendMail(options)
    console.log('[mail] sent', result.messageId)
    return result
  } catch (error) {
    console.error('[mail] send failed:', error.message, error.stack)
    throw error
  }
}

export default sendMail
