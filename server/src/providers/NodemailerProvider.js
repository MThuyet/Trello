const nodeMailer = require('nodemailer')
const { env } = require('~/config/environment')

const sendMail = (to, subject, htmlContent) => {
  const transporter = nodeMailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: false,
    auth: {
      user: env.ADMIN_EMAIL,
      pass: env.ADMIN_PASSWORD
    }
  })

  const options = {
    from: env.ADMIN_EMAIL, // địa chỉ admin email bạn dùng để gửi
    to: to, // địa chỉ gửi đến
    subject: subject, // Tiêu đề của mail
    html: htmlContent // Phần nội dung mail
  }

  // hàm transporter.sendMail() này sẽ trả về cho chúng ta một Promise
  return transporter.sendMail(options)
}

module.exports = {
  sendMail: sendMail
}
