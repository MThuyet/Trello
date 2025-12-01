import { StatusCodes } from 'http-status-codes'
import { Resend } from 'resend'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

const resend = new Resend(env.RESEND_API_KEY)

export const sendEmail = async (to, subject, htmlContent) => {
  const { data, error } = await resend.emails.send({
    from: env.ADMIN_EMAIL,
    to: to,
    subject: subject,
    html: htmlContent,
  })

  if (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }

  return data
}
