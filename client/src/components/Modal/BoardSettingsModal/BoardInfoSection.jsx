import SubtitlesIcon from '@mui/icons-material/Subtitles'
import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import { Box } from '@mui/material'

import { BOARD_TYPES } from '~/utils/constants'
import { useEffect, useRef, useState } from 'react'
import { updateBoardDetailsAPI } from '~/apis'
import { useDispatch } from 'react-redux'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'

const BoardInfoSection = ({ isOpen, currentBoard, updateBoardInRedux }) => {
  const dispatch = useDispatch()
  const [description, setDescription] = useState(currentBoard?.description || '')
  const [type, setType] = useState(currentBoard?.type || BOARD_TYPES.PUBLIC)
  const [isLoadingTitle, setIsLoadingTitle] = useState(false)
  const [isLoadingDescription, setIsLoadingDescription] = useState(false)
  const [isLoadingType, setIsLoadingType] = useState(false)

  // sync data
  useEffect(() => {
    if (!currentBoard) return
    setDescription(currentBoard?.description || '')
    setType(currentBoard?.type || BOARD_TYPES.PUBLIC)
  }, [currentBoard])

  // Ref để track xem description field có đang focus không
  const isEditingDescriptionRef = useRef(false)
  useEffect(() => {
    if (!isOpen) return

    // Sync description - chỉ khi user không đang edit
    if (!isEditingDescriptionRef.current) {
      const newDescription = currentBoard.description || ''
      if (newDescription !== description) {
        setDescription(newDescription)
      }
    }

    // Sync type - luôn sync vì không phải text input
    const newType = currentBoard.type || BOARD_TYPES.PUBLIC
    if (newType !== type) {
      setType(newType)
    }
  }, [isOpen, currentBoard, description, type])

  // Cập nhật board title
  const handleUpdateBoardTitle = async (title) => {
    try {
      if (!currentBoard?._id) return

      const newTitle = title.trim()
      if (newTitle.length < 3 || newTitle.length > 50) {
        dispatch(showSnackbar({ message: 'Board title must be between 3 and 50 characters', severity: 'error' }))
        return false
      }

      setIsLoadingTitle(true)
      const updatedBoard = await updateBoardDetailsAPI(currentBoard._id, { title: newTitle })
      updateBoardInRedux(updatedBoard)
      return true
    } catch (error) {
      return false
    } finally {
      setIsLoadingTitle(false)
    }
  }

  // Cập nhật board description
  const handleUpdateDescription = async () => {
    try {
      if (!currentBoard?._id) return

      // Lưu giá trị cũ để có thể rollback nếu validate fail hoặc API fail
      const oldDescription = currentBoard?.description || ''

      const newDescription = description.trim()
      if (newDescription.length < 3 || newDescription.length > 255) {
        dispatch(showSnackbar({ message: 'Board description must be between 3 and 255 characters', severity: 'error' }))
        setDescription(oldDescription) // Reset về giá trị cũ
        return
      }

      // Nếu không có thay đổi, không cần update
      if (newDescription === oldDescription) return

      setIsLoadingDescription(true)
      const updatedBoard = await updateBoardDetailsAPI(currentBoard._id, { description: newDescription })
      updateBoardInRedux(updatedBoard)
    } catch (error) {
      // Reset về giá trị cũ khi API fail
      const oldDescription = currentBoard?.description || ''
      setDescription(oldDescription)
    } finally {
      setIsLoadingDescription(false)
    }
  }

  // Cập nhật board type
  const handleUpdateType = async (type) => {
    if (!currentBoard?._id) return

    if (type === currentBoard?.type) return

    setIsLoadingType(true)
    const updatedBoard = await updateBoardDetailsAPI(currentBoard._id, { type })
    updateBoardInRedux(updatedBoard)
    setIsLoadingType(false)
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SubtitlesIcon />
        <ToggleFocusInput
          disabled={isLoadingTitle}
          value={currentBoard?.title || ''}
          onChangedValue={handleUpdateBoardTitle}
          inputFontSize="18px"
        />
      </Box>

      {/* Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: '600' }}>
          Description
        </Typography>
        <TextField
          disabled={isLoadingDescription}
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => {
            isEditingDescriptionRef.current = true
          }}
          onBlur={() => {
            isEditingDescriptionRef.current = false
            handleUpdateDescription()
          }}
          placeholder="Add a description to your board..."
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Type */}
      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: '600' }}>
          Visibility
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Board Type</InputLabel>
          <Select
            disabled={isLoadingType}
            value={type}
            label="Board Type"
            onChange={(e) => {
              const newType = e.target.value
              setType(newType)
              handleUpdateType(newType)
            }}>
            <MenuItem value={BOARD_TYPES.PUBLIC}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Public</Typography>
                <Typography variant="caption" color="text.secondary">
                  - Anyone can view
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value={BOARD_TYPES.PRIVATE}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Private</Typography>
                <Typography variant="caption" color="text.secondary">
                  - Only members can view
                </Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  )
}

export default BoardInfoSection
