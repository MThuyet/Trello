import { env } from '~/config/environment'

// những domain được phép truy cập tới tài nguyên của server
export const WHITELIST_DOMAINS = [
  'https://mthuyet.site',
  'https://www.mthuyet.site',
  // không cần localhost nữa vì config cors đã luôn cho phép môi trường dev
  // 'http://localhost:5173'
]

// các kiểu kiểu của bảng
export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
}

// Kiểm tra môi trường để quyết định dùng domain nào
// Nếu là production (BUILD_MODE === 'production' hoặc NODE_ENV === 'production') => dùng WEBSITE_DOMAIN_PRODUCTION
// Nếu không có WEBSITE_DOMAIN_PRODUCTION thì fallback về WEBSITE_DOMAIN_DEVELOPMENT
// Nếu là development => luôn dùng WEBSITE_DOMAIN_DEVELOPMENT
const isProduction = env.BUILD_MODE === 'production' || process.env.NODE_ENV === 'production'
export const WEBSITE_DOMAIN = isProduction
  ? env.WEBSITE_DOMAIN_PRODUCTION || env.WEBSITE_DOMAIN_DEVELOPMENT
  : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 12

// các kiểu của invitation
export const INVITATION_TYPES = {
  BOARD_INVITATION: 'BOARD_INVITATION',
}

// status của boardInvitation
export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
}

// action update members card
export const ACTION_UPDATE_CARD_MEMBERS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
}
