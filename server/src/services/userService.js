import bcryptjs from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { renderTemplateHtml } from '~/utils/renderTemplateHtml'
import { sendEmail } from '~/providers/ResendProvider'

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
      verifyToken: uuidv4(),
    }

    // thực hiện lưu vào database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // gửi email xác thực tài khoản
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const subject = 'Welcome to Trello Clone - Email Verification'

    // Render email template với verification link
    const htmlContent = renderTemplateHtml('emailVerification', {
      verificationLink,
    })

    // gửi email xác thực tài khoản
    await sendEmail(getNewUser.email, subject, htmlContent)

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
    if (existUser.isActive) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Your account is already active')
    if (existUser.verifyToken !== reqBody.token) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid token')

    // update isActive & verifyToken
    const updateData = {
      isActive: true,
      verifyToken: null,
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
    if (!existUser.isActive) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Your account is not active, please verify your email!')

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
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')

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
  update,
}
