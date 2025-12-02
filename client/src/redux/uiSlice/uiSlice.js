import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  snackbar: {
    open: false,
    message: '',
    severity: 'error',
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'error',
      }
    },

    hideSnackbar: (state) => {
      state.snackbar.open = false
    },
  },
})

export const { showSnackbar, hideSnackbar } = uiSlice.actions
export const selectSnackbar = (state) => state.ui.snackbar
export const uiReducer = uiSlice.reducer
