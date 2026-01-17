import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentActiveCard: null,
  isShowModalActiveCard: false,
}

export const activeCardSlice = createSlice({
  name: 'activeCard',
  initialState,
  reducers: {
    showModalActiveCard: (state) => {
      state.isShowModalActiveCard = true
    },

    clearAndHideCurrentActiveCard: (state) => {
      state.currentActiveCard = null
      state.isShowModalActiveCard = false
    },

    updateCurrentActiveCard: (state, action) => {
      const fullCard = action.payload
      state.currentActiveCard = fullCard
    },

    // ==================== LABEL REDUCERS ====================

    /**
     * Cập nhật toàn bộ labels của activeCard
     */
    updateCardLabels: (state, action) => {
      if (state.currentActiveCard) {
        state.currentActiveCard.labels = action.payload
      }
    },

    /**
     * Thêm label mới vào activeCard
     */
    addLabelToActiveCard: (state, action) => {
      if (state.currentActiveCard) {
        if (!state.currentActiveCard.labels) {
          state.currentActiveCard.labels = []
        }
        state.currentActiveCard.labels.push(action.payload)
      }
    },

    /**
     * Xóa label khỏi activeCard
     */
    removeLabelFromActiveCard: (state, action) => {
      if (state.currentActiveCard && state.currentActiveCard.labels) {
        state.currentActiveCard.labels = state.currentActiveCard.labels.filter((label) => label._id !== action.payload)
      }
    },
  },

  // eslint-disable-next-line no-unused-vars
  extraReducers: (builder) => {},
})

export const {
  clearAndHideCurrentActiveCard,
  updateCurrentActiveCard,
  showModalActiveCard,
  // Label actions
  updateCardLabels,
  addLabelToActiveCard,
  removeLabelFromActiveCard,
} = activeCardSlice.actions

export const selectCurrentActiveCard = (state) => {
  return state.activeCard.currentActiveCard
}

export const selectIsShowModalActiveCard = (state) => {
  return state.activeCard.isShowModalActiveCard
}

export const activeCardReducer = activeCardSlice.reducer
