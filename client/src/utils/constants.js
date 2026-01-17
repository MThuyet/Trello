let apiRoot = ''

if (process.env.BUILD_MODE === 'dev') {
  apiRoot = 'http://localhost:8017'
}

if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://api.mthuyet.online'
}

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
}

export const ACTION_UPDATE_CARD_MEMBERS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
}

export const API_ROOT = apiRoot

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 12

// Card label colors with styling
export const LABEL_COLORS = {
  green: { bg: '#61bd4f', hover: '#519839', text: 'white' },
  yellow: { bg: '#f2d600', hover: '#d9b51c', text: '#172b4d' },
  orange: { bg: '#ff9f1a', hover: '#cd8313', text: 'white' },
  red: { bg: '#eb5a46', hover: '#b04632', text: 'white' },
  purple: { bg: '#c377e0', hover: '#89609e', text: 'white' },
  blue: { bg: '#0079bf', hover: '#055a8c', text: 'white' },
  sky: { bg: '#00c2e0', hover: '#0098b7', text: 'white' },
  lime: { bg: '#51e898', hover: '#4bce87', text: '#172b4d' },
  pink: { bg: '#ff78cb', hover: '#c75bad', text: 'white' },
  black: { bg: '#344563', hover: '#091e42', text: 'white' },
}
