import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import { createSearchParams, useNavigate } from 'react-router-dom'
import { fetchBoardsAPI } from '~/apis'
import { useDebounceFn } from '~/customHooks/useDebounceFn'

// https://mui.com/material-ui/react-autocomplete/#asynchronous-requests
function AutoCompleteSearchBoard() {
  const navigate = useNavigate()

  // State xử lý hiển thị kết quả fetch về từ API
  const [open, setOpen] = useState(false)
  // State lưu trữ danh sách board fetch về được
  const [boards, setBoards] = useState(null)
  // State giữ board được chọn để đồng bộ với Autocomplete
  const [selectedBoard, setSelectedBoard] = useState(null)
  // Sẽ hiện loading khi bắt đầu gọi api fetch boards
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Khi đóng phần list kết quả lại thì đồng thời clear cho boards về null
    if (!open) {
      setBoards(null)
    }
  }, [open])

  // Xử lý việc nhận data nhập vào từ input sau đó gọi API để lấy kết quả về
  const handleInputSearchChange = (event) => {
    const searchValue = event.target?.value
    if (!searchValue) return

    // Dùng createSearchParams của react-router-dom để tạo searchPath chuẩn với q[title] để gọi lên API
    const searchPath = `?${createSearchParams({ 'q[title]': searchValue })}`

    // call api
    setLoading(true)
    fetchBoardsAPI(searchPath)
      .then((res) => {
        setBoards(res.boards || [])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Debounce
  const debounceSearchBoards = useDebounceFn(handleInputSearchChange)

  // Khi chúng ta select chọn một board cụ thể thì sẽ điều hướng tới board đó
  const handleSelectedBoard = (event, board) => {
    setSelectedBoard(board)
    if (board) navigate(`/boards/${board._id}`)
  }

  return (
    <Autocomplete
      sx={{ width: 220 }}
      id="asynchronous-search-board"
      // text này hiện ra khi boards là null hoặc sau khi đã fetch boards nhưng rỗng - không có kết quả
      noOptionsText={!boards ? 'Type to search board...' : 'No board found!'}
      // Cụm này để handle việc đóng mở phần kết quả tìm kiếm
      open={open}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={() => {
        setOpen(false)
        setSelectedBoard(null)
      }}
      // getOptionLabel: để Autocomplete lấy title của board và hiển thị ra
      getOptionLabel={(board) => board.title}
      // Options của Autocomplete cần đầu vào là 1 Array, mà boards của chúng ta ban đầu cần cho null để làm cái noOptionsText ở trên nên đoạn này cần thêm cái || [] vào
      options={boards || []}
      value={selectedBoard}
      loading={loading}
      // onInputChange sẽ chạy khi gõ nội dung vào thẻ input
      onInputChange={debounceSearchBoards}
      // onChange của cả Autocomplete sẽ chạy khi chúng ta select một kết quả
      onChange={handleSelectedBoard}
      // Render thẻ input để nhập nội dung tìm kiếm
      renderInput={(params) => (
        <TextField
          {...params}
          label="Type to search..."
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'white' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{
            '& label': { color: 'white' },
            '& input': { color: 'white' },
            '& label.Mui-focused': { color: 'white' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'white' },
              '&:hover fieldset': { borderColor: 'white' },
              '&.Mui-focused fieldset': { borderColor: 'white' },
            },
            '.MuiSvgIcon-root': { color: 'white' },
          }}
        />
      )}
    />
  )
}

export default AutoCompleteSearchBoard
