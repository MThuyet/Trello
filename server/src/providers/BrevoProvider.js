// https://github.com/getbrevo/brevo-node
// cấu hình theo thư viện
const SibApiV3Sdk = require('@getbrevo/brevo')
import { env } from '~/config/environment'

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (recipientEmail, recipientName, customSubject, customHtmlContent) => {
  // khởi tạo một sendSmtpEmail
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  // tài khoản gửi mail là email tạo trên Brevo
  sendSmtpEmail.sender = { email: env.ADMIN_EMAIL_ADDRESS, name: env.ADMIN_EMAIL_NAME }
  // tài khoản nhận mail
  sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }]
  // tiêu đề
  sendSmtpEmail.subject = customSubject
  // nội dung mail dạng html
  sendSmtpEmail.htmlContent = customHtmlContent

  // gọi hành động gửi mail
  // sendTransacEmail trả về 1 promise

  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export const BrevoProvider = {
  sendEmail
}
