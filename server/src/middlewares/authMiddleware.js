import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import ApiError from '~/utils/ApiError'

// xác thực JWT nhận được từ phía FE có hợp lệ hay không
const isAuthorized = async (req, res, next) => {
  // lấy accessToken nằm trong request cookies phía client thông qua withCredentials: true trong axios
  const clientAccessToken = req.cookies?.accessToken

  // nếu clientAccessToken không tồn tại thì trả về lỗi
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Token not found)'))
    return
  }

  try {
    // B1: thực hiện giải mã xem token có hợp lệ hay không
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SIGNATURE)

    // B2: Nếu như token hợp lệ, thì phải lưu thông tin giải mã được vào req.jwtDecoded để sử dụng cho các tầng xử lý phía sau
    req.jwtDecoded = accessTokenDecoded

    // B3: cho phép request đi tiếp
    next()
  } catch (error) {
    // nếu accessToken bị hết hạn thì trả về mã lỗi GONE-410 cho FE biết để gọi api refreshToken
    if (error?.message.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Unauthorized! (Access token expired)'))
      return
    }

    // nếu accessToken không hợp lệ do bất kì điều gì ngoài hết hạn thì trả về cho FE mã 401 để sign out
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Invalid access token)'))
  }
}

export const authMiddleware = { isAuthorized }
