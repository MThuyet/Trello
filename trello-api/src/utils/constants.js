import { env } from '~/config/environment'

// những domain được phép truy cập tới tài nguyên của server
export const WHITELIST_DOMAINS = [
  'https://mthuyet-trello-web.vercel.app',
  'https://www.mthuyet.site',
  'https://mthuyet-trello-api.onrender.com'
  // không cần localhost nữa vì config cors đã luôn cho phép môi trường dev
  // 'http://localhost:5173'
]

// các kiểu kiểu của bảng
export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

export const WEBSITE_DOMAIN = env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 12
