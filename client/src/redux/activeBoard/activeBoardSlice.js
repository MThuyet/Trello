import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { mapOrder } from '~/utils/sorts'
import { isEmpty } from 'lodash'
import { generatePlaceholderCard } from '~/utils/formatter'

// khởi tạo giá trị State của một Slice trong redux
const initialState = {
  currentActiveBoard: null,
}

// Các hành động gọi api (bất đồng bộ) và cập nhật dữ liệu vào Redux, dùng createAsyncThunk đi kèm với extraReducers https://redux-toolkit.js.org/api/createAsyncThunk
export const fetchBoardDetailsAPI = createAsyncThunk(
  // tên định danh, đặt theo quy tắc name/functionName
  'activeBoard/fetchBoardDetailsAPI',
  // async function
  async (boardId) => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${boardId}`)
    return response.data
  },
)

// khởi tạo một Slice trong kho lưu trữ redux
export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  // reducers: nơi xử lý dữ liệu đồng bộ
  reducers: {
    updateCurrentActiveBoard: (state, action) => {
      // action.payload là chuẩn đặt tên nhận dữ liệu vào reducer, nhưng ở đây đang gán nó ra một biến có ý nghĩa hơn
      const board = action.payload

      // xử lý dữ liệu
      Object.keys(board).forEach((key) => {
        state.currentActiveBoard[key] = board[key]
      })

      // Nếu columnOrderIds được cập nhật, cần sắp xếp lại columns theo thứ tự mới
      if (board.columnOrderIds && state.currentActiveBoard.columns) {
        state.currentActiveBoard.columns = mapOrder(state.currentActiveBoard.columns, board.columnOrderIds, '_id')
      }
    },

    moveCardToDifferentColumnState: (state, action) => {
      const data = action.payload

      // xóa card khỏi column gốc
      const originalColumn = state.currentActiveBoard.columns.find((column) => column._id === data.originalColumnId)
      if (originalColumn) {
        originalColumn.cards = originalColumn.cards.filter((card) => card._id !== data.cardId)
        // Nếu column trống (không còn card thật), thêm placeholder để vẫn kéo thả được
        if (isEmpty(originalColumn.cards)) {
          const placeholderCard = generatePlaceholderCard(originalColumn)
          originalColumn.cards = [placeholderCard]
        }
        // cardOrderIds luôn được sync theo danh sách cards hiện tại (bao gồm placeholder nếu có)
        originalColumn.cardOrderIds = originalColumn.cards.map((card) => card._id)
      }

      const newColumn = state.currentActiveBoard.columns.find((column) => column._id === data.newColumnId)
      if (newColumn) {
        // Loại bỏ card nếu đã tồn tại để tránh nhân đôi (trường hợp optimistic update phía client)
        newColumn.cards = newColumn.cards.filter((card) => card._id !== data.cardId)
        // Bỏ placeholder nếu đang tồn tại trong column đích
        newColumn.cards = newColumn.cards.filter((card) => !card.FE_PlaceholderCard)
        newColumn.cards.push(data.card)
        // Sync cardOrderIds theo cards mới
        newColumn.cardOrderIds = newColumn.cards.map((card) => card._id)
        newColumn.cards = mapOrder(newColumn.cards, newColumn.cardOrderIds, '_id')
      }
    },

    addMemberToBoard: (state, action) => {
      // action.payload chứa thông tin member mới từ socket event
      const newMember = action.payload

      // Kiểm tra xem có board trong state không
      if (!state.currentActiveBoard) {
        console.warn('Cannot add member: No active board')
        return
      }

      // Kiểm tra xem member đã tồn tại chưa (tránh duplicate)
      const isMemberExists = state.currentActiveBoard.members.some((member) => member._id === newMember._id)
      if (isMemberExists) {
        console.log('Member already exists in board:', newMember.displayName)
        return
      }

      // Thêm member mới vào mảng members
      state.currentActiveBoard.members.push(newMember)

      // Cập nhật lại FE_allUsers (gộp owners + members)
      state.currentActiveBoard.FE_allUsers = state.currentActiveBoard.owners.concat(state.currentActiveBoard.members)
    },

    removeMemberFromBoard: (state, action) => {
      // action.payload chứa thông tin member bị xóa từ socket event
      const removedMember = action.payload

      if (!state.currentActiveBoard) {
        console.warn('Cannot remove member: No active board')
        return
      }

      // xóa member khỏi mảng members
      // filter mảng mới không chứa member vừa bị xóa
      state.currentActiveBoard.members = state.currentActiveBoard.members.filter((member) => member._id !== removedMember._id)

      // cập nhật lại FE_allUser
      state.currentActiveBoard.FE_allUsers = state.currentActiveBoard.owners.concat(state.currentActiveBoard.members)
    },

    addColumnToBoard: (state, action) => {
      const newColumn = action.payload

      if (!state.currentActiveBoard) return

      // Kiểm tra xem column đã tồn tại chưa (tránh duplicate)
      const isColumnExists = state.currentActiveBoard.columns.some((col) => col._id === newColumn._id)
      if (isColumnExists) return

      if (isEmpty(newColumn.cards)) {
        newColumn.cards = [generatePlaceholderCard(newColumn)]
        newColumn.cardOrderIds = [generatePlaceholderCard(newColumn)._id]
      }

      state.currentActiveBoard.columns.push(newColumn)
      state.currentActiveBoard.columnOrderIds.push(newColumn._id)
    },

    updateColumnInBoard: (state, action) => {
      const columnUpdated = action.payload

      if (!state.currentActiveBoard) return

      // tìm column trong state
      const oldColumn = state.currentActiveBoard.columns.find((column) => column._id === columnUpdated._id)
      if (oldColumn) {
        Object.keys(columnUpdated).forEach((key) => {
          oldColumn[key] = columnUpdated[key]
        })

        if (isEmpty(oldColumn.cards)) {
          oldColumn.cards = [generatePlaceholderCard(oldColumn)]
          oldColumn.cardOrderIds = [generatePlaceholderCard(oldColumn)._id]
        } else {
          oldColumn.cards = mapOrder(oldColumn.cards, oldColumn.cardOrderIds, '_id')
        }
      }
    },

    removeColumnFromBoard: (state, action) => {
      const { columnId } = action.payload

      if (!state.currentActiveBoard) return

      state.currentActiveBoard.columns = state.currentActiveBoard.columns.filter((column) => column._id !== columnId)
      state.currentActiveBoard.columnOrderIds = state.currentActiveBoard.columnOrderIds.filter((id) => id !== columnId)
    },

    addCardToColumn: (state, action) => {
      const newCard = action.payload

      if (!state.currentActiveBoard) return
      const column = state.currentActiveBoard.columns.find((column) => column._id === newCard.columnId)
      if (!column) return
      column.cards.push(newCard)
      column.cardOrderIds.push(newCard._id)
    },

    updateCardInBoard: (state, action) => {
      // update nested data
      // https://redux-toolkit.js.org/usage/immer-reducers#updating-nested-data
      const incomingCard = action.payload

      // tìm dần từ board -> column -> card
      const column = state.currentActiveBoard.columns.find((column) => column._id === incomingCard.columnId)
      if (column) {
        const card = column.cards.find((card) => card._id === incomingCard._id)
        if (card) {
          Object.keys(incomingCard).forEach((key) => {
            card[key] = incomingCard[key]
          })
        }
      }
    },

    removeCardFromBoard: (state, action) => {
      const { cardId, columnId } = action.payload

      if (!state.currentActiveBoard) return

      // tìm column chứa card
      const column = state.currentActiveBoard.columns.find((column) => column._id === columnId)
      if (!column) return

      // xóa card khỏi mảng cards và cardOrderIds của column
      column.cards = column.cards.filter((card) => card._id !== cardId)
      column.cardOrderIds = column.cardOrderIds.filter((id) => id !== cardId)

      // nếu column rỗng, thêm placeholder card vào
      if (isEmpty(column.cards)) {
        const placeholderCard = generatePlaceholderCard(column)
        column.cards = [placeholderCard]
        column.cardOrderIds = [placeholderCard._id]
      }
    },
  },
  // extraReducers: nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    // thường chỉ bắt dữ liệu khi thành công, còn rejected hoặc pending đã bắt ở axios
    builder.addCase(fetchBoardDetailsAPI.fulfilled, (state, action) => {
      // action.payload là dữ liệu mà chúng ta return (response.data) ở function fetchBoardDetailsAPI
      let board = action.payload

      // thành viên trong board là gộp của owners và members
      board.FE_allUsers = board.owners.concat(board.members)

      // xử lý dữ liệu nếu cần thiết trước khi đưa vào state của redux
      // sắp xếp thứ tự các column trước khi đưa data xuống dưới để tránh conflic data
      board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')

      board.columns.forEach((column) => {
        // khi F5 web cũng cần xử lý kéo thả card cho column rỗng
        if (isEmpty(column.cards)) {
          column.cards = [generatePlaceholderCard(column)]
          column.cardOrderIds = [generatePlaceholderCard(column)._id]
          // sắp xếp thứ tự các card
        } else {
          column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
        }
      })

      // update lại dữ liệu của currentActiveBoard
      state.currentActiveBoard = board
    })
  },
})

// actions: là nơi dành cho các components gọi bằng dispatch() tới nó để cập nhật lại dữ liệu thông qua reducer (chạy đồng bộ)
// những actions này được redux tạo tự động theo tên của reducer
export const {
  updateCurrentActiveBoard,
  addCardToColumn,
  updateCardInBoard,
  removeCardFromBoard,
  addColumnToBoard,
  updateColumnInBoard,
  removeColumnFromBoard,
  addMemberToBoard,
  removeMemberFromBoard,
  moveCardToDifferentColumnState,
} = activeBoardSlice.actions

// selectors: là nơi dành cho các components gọi bằng hook useSelector() để lấy dữ liệu từ trong kho redux store ra để sử dụng
export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard
}

// tên file là activeBoardSlice nhưng phải export ra một thứ tên là reducer
// export default activeBoardSlice.reducer
export const activeBoardReducer = activeBoardSlice.reducer
