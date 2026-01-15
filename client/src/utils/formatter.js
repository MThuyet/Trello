// Viết hoa chữ cái đầu tiên của chuỗi
export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}

// ===== PLACEHOLDER CARD UTILITIES =====
// Tất cả logic xử lý placeholder card được tập trung ở đây

// Tạo placeholder card cho column rỗng
// Placeholder giúp column rỗng vẫn có thể nhận card khi kéo thả
export const generatePlaceholderCard = (column) => {
  return {
    _id: `${column._id}-placeholder-card`,
    boardId: column.boardId,
    columnId: column._id,
    FE_PlaceholderCard: true,
  }
}

// Kiểm tra card có phải placeholder không
export const isPlaceholderCard = (card) => card?.FE_PlaceholderCard === true

// Đảm bảo column rỗng có placeholder card
export const ensurePlaceholder = (column) => {
  if (!column.cards || column.cards.length === 0) {
    column.cards = [generatePlaceholderCard(column)]
    column.cardOrderIds = [column.cards[0]._id]
  }
}

// Xóa placeholder card khỏi column (khi có card thật)
export const removePlaceholder = (column) => {
  column.cards = column.cards.filter((card) => !isPlaceholderCard(card))
  column.cardOrderIds = column.cards.map((card) => card._id)
}

// dùng css pointer-event kết hợp với Axios interceptors để chặn user spam click tại bất kỳ chỗ nào có hành động click gọi api
// cách sử dụng: với tất cả các link hoặc button mà có hành động gọi api thì thêm class "interceptor-loading" cho nó
export const interceptorLoadingElements = (calling) => {
  // DOM lấy ra toàn bộ phần tử trên page hiện tại có className là 'interceptor-loading'
  const elements = document.querySelectorAll('.interceptor-loading')
  for (let i = 0; i < elements.length; i++) {
    if (calling) {
      // Nếu đang trong thời gian chờ gọi API (calling === true) thì sẽ làm mờ phần tử và chặn click bằng css pointer-events
      elements[i].style.opacity = '0.5'
      elements[i].style.pointerEvents = 'none'
    } else {
      // Ngược lại thì trả về như ban đầu, không làm gì cả
      elements[i].style.opacity = 'initial'
      elements[i].style.pointerEvents = 'initial'
    }
  }
}
