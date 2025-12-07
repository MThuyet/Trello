import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import { forwardRef } from 'react'

// thay vì phải tạo biến State để chuyển đổi qua lại giữa Input và Text thông thường, thì CSS lại cho Input trông như text bình thường, chỉ khi click và focus vào nó thì style lại trở về như cái input ban đầu.
// Controlled Input trong MUI: https://mui.com/material-ui/react-text-field/#uncontrolled-vs-controlled
const ToggleFocusInput = forwardRef(({ value, onChangedValue, inputFontSize = '16px', ...props }, ref) => {
  const [inputValue, setInputValue] = useState(value)

  // Đồng bộ inputValue với value prop khi value thay đổi từ bên ngoài
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const triggerBlur = async () => {
    // Support Trim dữ liệu State inputValue sau khi blur ra ngoài
    const trimmedValue = inputValue.trim()

    // Nếu giá trị rỗng hoặc không có gì thay đổi thì set lại giá trị gốc ban đầu theo value từ props và return
    if (!trimmedValue || trimmedValue === value) {
      setInputValue(value)
      return
    }

    // Lưu giá trị cũ để có thể rollback nếu callback fail
    const oldValue = value

    // Tạm thời set giá trị mới để hiển thị ngay (optimistic update)
    setInputValue(trimmedValue)

    try {
      // Gọi callback để parent component xử lý validation và hiển thị snackbar
      // Parent sẽ validate và return false nếu fail, return true nếu thành công
      const result = onChangedValue(trimmedValue)

      // Xử lý cả Promise và giá trị thường
      let finalResult = result
      if (result && typeof result.then === 'function') {
        // Nếu là Promise, đợi kết quả
        finalResult = await result
      }

      // Nếu callback trả về false, có nghĩa là validation fail hoặc không thành công
      if (!finalResult) {
        setInputValue(oldValue) // Rollback về giá trị cũ
      }
      // Nếu result là true hoặc undefined, giữ nguyên (value prop sẽ thay đổi và useEffect sẽ sync)
    } catch (error) {
      // Nếu callback throw error, rollback về giá trị cũ
      setInputValue(oldValue)
    }
  }

  return (
    <TextField
      id="toggle-focus-input-controlled"
      fullWidth
      variant="outlined"
      size="small"
      value={inputValue}
      onChange={(event) => {
        setInputValue(event.target.value)
      }}
      inputRef={ref}
      onBlur={triggerBlur}
      {...props}
      sx={{
        '& label': {},
        '& input': { fontSize: inputFontSize, fontWeight: 'bold' },
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'transparent',
          '& fieldset': { borderColor: 'transparent' },
        },
        '& .MuiOutlinedInput-root:hover': {
          borderColor: 'transparent',
          '& fieldset': { borderColor: 'transparent' },
        },
        '& .MuiOutlinedInput-root.Mui-focused': {
          backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#33485D' : 'white'),
          '& fieldset': { borderColor: 'primary.main' },
        },
        '& .MuiOutlinedInput-input': {
          px: '6px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        },
      }}
    />
  )
})

export default ToggleFocusInput
