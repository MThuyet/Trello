import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'
import { env } from '~/config/environment'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)

    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) {
    next(error)
  }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    // xử lý trả về httpOnly cookie cho trình duyệt
    // Cấu hình cookie dựa trên môi trường
    const cookieOptions = {
      httpOnly: true, // Chỉ cho phép cookie được truy cập bởi HTTP request, không thể truy cập qua JavaScript (ngăn XSS).
      secure: env.BUILD_MODE === 'production', // Chỉ gửi cookie khi kết nối là HTTPS (production)
      sameSite: 'Lax', // Cho phép cookie được gửi trong same-site requests (subdomain)
      path: '/',
      maxAge: ms('14d'), // thư viện tự convert sang milisecond
    }

    // Chỉ set domain khi production (subdomain)
    if (env.BUILD_MODE === 'production') {
      cookieOptions.domain = '.mthuyet.site' // Cookie sẽ được chia sẻ giữa tất cả subdomain
    }

    res.cookie('accessToken', result.accessToken, cookieOptions)
    res.cookie('refreshToken', result.refreshToken, cookieOptions)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    // xóa cookies - phải có đầy đủ options giống khi set cookie
    const clearCookieOptions = {
      httpOnly: true,
      secure: env.BUILD_MODE === 'production',
      sameSite: 'Lax',
      path: '/',
    }

    if (env.BUILD_MODE === 'production') {
      clearCookieOptions.domain = '.mthuyet.site'
    }

    res.clearCookie('accessToken', clearCookieOptions)
    res.clearCookie('refreshToken', clearCookieOptions)

    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    // lấy cookie từ phía client gửi lên và truyền vào userService
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    // tạo cookie mới và gửi về cho phía client
    const cookieOptions = {
      httpOnly: true,
      secure: env.BUILD_MODE === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: ms('14d'),
    }

    if (env.BUILD_MODE === 'production') {
      cookieOptions.domain = '.mthuyet.site'
    }

    res.cookie('accessToken', result.accessToken, cookieOptions)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, error.message))
  }
}

const update = async (req, res, next) => {
  try {
    // lấy userId từ accessToken đã được giải mã
    const userId = req.jwtDecoded._id
    const userAvatarFile = req.file
    const updatedUser = await userService.update(userId, req.body, userAvatarFile)

    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken,
  update,
}
