import bcryptjs from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import { sendMail } from '~/providers/NodemailerProvider'
import { CloundinaryProvider } from '~/providers/CloundinaryProvider'

const createNew = async (reqBody) => {
  try {
    // kiểm tra xem email đã tồn tại hay chưa
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')

    // tách chuỗi email thành mảng gồm 2 phần tử: phần trước @ và phần sau @
    const nameFromEmail = reqBody.email.split('@')[0]

    // tạo data
    const newUser = {
      email: reqBody.email,
      // tham số thứ 2 là độ phức tạp, giá trị càng cao thì băm càng lâu
      password: bcryptjs.hashSync(reqBody.password, 8),
      username: nameFromEmail,
      // khi đăng kí mới mặc định để giống username và sau này update
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    // thực hiện lưu vào database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // gửi email xác thực tài khoản
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const subject = '🎉 Welcome to Trello by MTHUYETDEV - Email Verification'
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    :root {
      --primary-color: #0079bf;
      --secondary-color: #026aa7;
      --accent-color: #61bd4f;
      --text-color: #172b4d;
      --text-light: #5e6c84;
      --background-color: #f4f5f7;
      --container-bg: #ffffff;
      --border-color: #dfe1e6;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: var(--background-color);
      margin: 0;
      padding: 0;
      color: var(--text-color);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: var(--background-color);
      padding: 40px 10px;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: var(--container-bg);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .header {
      background-color: var(--primary-color);
      padding: 30px;
      text-align: center;
      color: white;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }

    .content {
      padding: 40px 30px;
    }

    h2 {
      color: var(--primary-color);
      font-size: 22px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 20px;
    }

    p {
      margin: 0 0 20px;
      font-size: 16px;
    }

    .highlight {
      font-weight: 600;
      color: var(--primary-color);
    }

    .btn-container {
      text-align: center;
      margin: 25px 0;
    }

    .btn-verify {
      background-color: var(--primary-color);
      color: white;
      padding: 14px 36px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .btn-verify:hover {
      background-color: var(--secondary-color);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .link-container {
      margin: 25px 0;
      padding: 15px;
      background-color: var(--background-color);
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .link-text {
      word-break: break-all;
      font-size: 14px;
      color: var(--primary-color);
      text-decoration: none;
    }

    .divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 30px 0;
    }

    .footer {
      padding: 20px 30px 40px;
      text-align: center;
      color: var(--text-light);
      font-size: 14px;
    }

    .social-bar {
      padding: 15px 0;
      text-align: center;
      background-color: #f9f9f9;
      border-top: 1px solid var(--border-color);
    }

    .social-icon {
      display: inline-block;
      margin: 0 10px;
      width: 32px;
      height: 32px;
    }

    .help-text {
      font-size: 13px;
      margin-top: 20px;
    }

    @media screen and (max-width: 600px) {
      .wrapper {
        padding: 10px 5px;
      }
      .content, .footer {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="header" style="background-color: #0079bf; padding: 30px; text-align: center; color: white;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <img src="https://i.imgur.com/lDLQ9Vx.png" alt="Trello Logo" style="width: 40px; height: auto; margin-bottom: 10px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: white;">Trello</h1>
            </td>
          </tr>
        </table>
      </div>

      <div class="content">
        <h2>Verify Your Email Address</h2>

        <p>Hi there,</p>

        <p>Thank you for signing up for <span class="highlight">Trello</span>. We're excited to have you join our community of productive teams and individuals!</p>

        <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>

        <div class="btn-container">
          <a href="${verificationLink}" class="btn-verify">Verify My Email</a>
        </div>

        <p>If the button above doesn't work, you can also verify by copying and pasting the following link into your browser:</p>

        <div class="link-container">
          <a href="${verificationLink}" class="link-text">${verificationLink}</a>
        </div>

        <div class="divider"></div>

        <p><strong>What's Next?</strong></p>
        <p>After verification, you'll be able to:</p>
        <ul>
          <li>Create and organize boards</li>
          <li>Collaborate with your team</li>
          <li>Track your projects efficiently</li>
          <li>Customize your workflow</li>
        </ul>

        <p>We can't wait to see what you'll accomplish with Trello!</p>
      </div>

      <div class="social-bar">
        <a href="https://www.facebook.com/MThuyet?locale=vi_VN"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon"></a>
        <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" class="social-icon"></a>
        <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon"></a>
      </div>

      <div class="footer">
        <p>This email was sent to ${getNewUser.email}</p>
        <p>If you didn't create an account with us, you can safely ignore this email.</p>
        <p class="help-text">For help or support, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} Trello. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`

    // gửi email xác thực tài khoản
    await sendMail(getNewUser.email, subject, htmlContent)

    // trả về dữ liệu cho controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // các bước kiểm tra cần thiết
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active')
    if (existUser.verifyToken !== reqBody.token) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid token')

    // update isActive & verifyToken
    const updateData = {
      isActive: true,
      verifyToken: null
    }
    const updatedUser = await userModel.update(existUser._id, updateData)

    // return user after updated
    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // các bước kiểm tra cần thiết
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Wrong email or password')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password))
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Wrong email or password')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active, please verify your email!')

    // tạo token đăng nhập để trả về cho client
    const userInfo = { _id: existUser._id, email: existUser.email }

    // tạo ra 2 loại token: accessToken và refreshToken
    const accessToken = await JwtProvider.genegrateToken(userInfo, env.ACCESS_TOKEN_SIGNATURE, env.ACCESS_TOKEN_LIFE)
    const refreshToken = await JwtProvider.genegrateToken(userInfo, env.REFRESH_TOKEN_SIGNATURE, env.REFRESH_TOKEN_LIFE)

    // trả về thông tin của user kèm 2 token vừa tạo
    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    // giải mã refreshToken
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SIGNATURE)

    // lấy thông tin user từ refreshToken
    const userInfo = { _id: refreshTokenDecoded._id, email: refreshTokenDecoded.email }

    // tạo accessToken mới
    const accessToken = await JwtProvider.genegrateToken(userInfo, env.ACCESS_TOKEN_SIGNATURE, env.ACCESS_TOKEN_LIFE)

    return { accessToken }
  } catch (error) {
    throw error
  }
}

const update = async (userId, reqBody, userAvatarFile) => {
  try {
    // check
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    let updatedUser = {}

    // trường hợp change password
    if (reqBody.current_password && reqBody.new_password) {
      // check current password
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password))
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Current password is incorrect!')

      // nếu đúng thì check new password
      if (reqBody.new_password === reqBody.current_password)
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'New password cannot be the same as the current password!')

      // update password
      updatedUser = await userModel.update(existUser._id, { password: bcryptjs.hashSync(reqBody.new_password, 8) })
    } else if (userAvatarFile) {
      // trường hợp upload file lên cloudinary
      const uploadResult = await CloundinaryProvider.streamUpload(userAvatarFile.buffer, 'users')

      // lưu lại secure_url của avatar vừa upload vào db
      updatedUser = await userModel.update(existUser._id, { avatar: uploadResult.secure_url })
    } else {
      // trường hợp update thông tin chung (displayName)
      updatedUser = await userModel.update(existUser._id, reqBody)
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update
}
