let apiRoot = ''

if (process.env.BUILD_MODE === 'dev') {
  apiRoot = 'http://localhost:8017'
}

if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'http://api.mthuyet.site:30760'
}

export const ACTION_UPDATE_CARD_MEMBERS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
}

export const API_ROOT = apiRoot

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 12
