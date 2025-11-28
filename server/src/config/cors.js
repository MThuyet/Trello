import { WHITELIST_DOMAINS } from '~/utils/constants'
import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// Cấu hình CORS Option
export const corsOptions = {
  origin: function (origin, callback) {
    // origin là domain của request
    // call back là một hàm được truyền vào để xử lý kết quả sau khi kiểm tra origin, tham số thứ nhất để hứng lỗi, nếu ko có lỗi sẽ là null, tham số thứ 2 là boolean cho biết có cho phép request truy cập hay ko

    // Nếu origin là undefined (truy cập trực tiếp) hoặc môi trường dev, cho phép
    if (!origin || env.BUILD_MODE === 'dev') {
      return callback(null, true)
    }

    // Kiểm tra xem origin có phải là domain được chấp nhận hay không
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // nếu origin không được chấp nhận thì từ chối truy cập và trả về lỗi (chỉ có 1 tham số)
    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200,

  // CORS sẽ cho phép nhận cookies từ request
  credentials: true
}
