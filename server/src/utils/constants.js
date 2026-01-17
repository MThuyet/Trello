import { env } from '~/config/environment'

// những domain được phép truy cập tới tài nguyên của server
export const WHITELIST_DOMAINS = [
  'https://mthuyet.online',
  'https://www.mthuyet.online',
  // không cần localhost nữa vì config cors đã luôn cho phép môi trường dev
  // 'http://localhost:5173'
]

// các kiểu kiểu của bảng
export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
}

// Ưu tiên dùng WEBSITE_DOMAIN_PRODUCTION nếu được set (khi deploy)
// Nếu không có WEBSITE_DOMAIN_PRODUCTION thì mới dùng WEBSITE_DOMAIN_DEVELOPMENT (môi trường dev)
// Kiểm tra cả BUILD_MODE và NODE_ENV để đảm bảo đúng môi trường production
export const WEBSITE_DOMAIN = env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

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

// Card label colors
export const LABEL_COLORS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  RED: 'red',
  PURPLE: 'purple',
  BLUE: 'blue',
  SKY: 'sky',
  LIME: 'lime',
  PINK: 'pink',
  BLACK: 'black',
}

// Label color hex mapping (for reference)
export const LABEL_COLOR_MAP = {
  green: { bg: '#61bd4f', hover: '#519839' },
  yellow: { bg: '#f2d600', hover: '#d9b51c' },
  orange: { bg: '#ff9f1a', hover: '#cd8313' },
  red: { bg: '#eb5a46', hover: '#b04632' },
  purple: { bg: '#c377e0', hover: '#89609e' },
  blue: { bg: '#0079bf', hover: '#055a8c' },
  sky: { bg: '#00c2e0', hover: '#0098b7' },
  lime: { bg: '#51e898', hover: '#4bce87' },
  pink: { bg: '#ff78cb', hover: '#c75bad' },
  black: { bg: '#344563', hover: '#091e42' },
}
