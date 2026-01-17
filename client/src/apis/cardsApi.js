import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

// create new card
export const createNewCardAPI = async (newCardData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/cards`, newCardData)
  return response.data
}

// update card details
export const updateCardDetailsAPI = async (cardId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/cards/${cardId}`, updateData)
  return response.data
}

// delete one card
export const deleteOneCardAPI = async (cardId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/cards/${cardId}`)
  return response.data
}

// ==================== LABEL APIs ====================

/**
 * Thêm label vào card
 * @param {string} cardId - ID của card
 * @param {object} labelData - { color: string, text?: string }
 */
export const addLabelToCardAPI = async (cardId, labelData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/cards/${cardId}/labels`, labelData)
  return response.data
}

/**
 * Cập nhật label trong card
 * @param {string} cardId - ID của card
 * @param {string} labelId - ID của label
 * @param {object} labelData - { color?: string, text?: string }
 */
export const updateCardLabelAPI = async (cardId, labelId, labelData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/cards/${cardId}/labels/${labelId}`, labelData)
  return response.data
}

/**
 * Xóa label khỏi card
 * @param {string} cardId - ID của card
 * @param {string} labelId - ID của label
 */
export const removeLabelFromCardAPI = async (cardId, labelId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/cards/${cardId}/labels/${labelId}`)
  return response.data
}
