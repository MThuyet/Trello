import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

const initialState = {
  currentNotifications: [],
}

export const fetchInvitationsAPI = createAsyncThunk('notifications/fetchInvitationsAPI', async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/invitations`)
  return response.data
})

export const updateBoardInvitationAPI = createAsyncThunk('notifications/updateBoardInvitationAPI', async ({ status, invitationId }) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/invitations/board/${invitationId}`, { status })
  return response.data
})

// khởi tạo slice
export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearCurrentNotifications: (state) => (state.currentNotifications = null),

    updateCurrentNotifications: (state, action) => {
      state.currentNotifications = action.payload
    },

    addNotification: (state, action) => {
      const inCommingInvitation = action.payload
      // thêm phần tử vào đầu mảng
      state.currentNotifications.unshift(inCommingInvitation)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchInvitationsAPI.fulfilled, (state, action) => {
      let inCommingInvitations = action.payload
      // đảo ngược lại mảng invitations nhận được để hiển thị cái mới nhất lên đầu
      state.currentNotifications = Array.isArray(inCommingInvitations) ? inCommingInvitations.reverse() : []
    })

    builder.addCase(updateBoardInvitationAPI.fulfilled, (state, action) => {
      const inCommingInvitation = action.payload
      // cập nhật lại dữ liệu boardInvitation ( bên trong nó sẽ có status mới khi update)
      const getInvitation = state.currentNotifications.find((i) => i._id === inCommingInvitation._id)
      getInvitation.boardInvitation = inCommingInvitation.boardInvitation
    })
  },
})

export const { clearCurrentNotifications, updateCurrentNotifications, addNotification } = notificationsSlice.actions

export const selectCurrentNotifications = (state) => state.notifications.currentNotifications

export const notificationReducer = notificationsSlice.reducer
