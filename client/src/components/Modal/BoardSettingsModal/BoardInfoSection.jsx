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

const BoardInfoSection = ({ isOpen, currentBoard, updateBoardInRedux }) => {
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
    if (!currentBoard?._id) return

    const normalizedTitle = title?.trim()
    const currentTitle = currentBoard?.title?.trim()
    if (!normalizedTitle || normalizedTitle === currentTitle) return

    setIsLoadingTitle(true)
    const updatedBoard = await updateBoardDetailsAPI(currentBoard._id, { title: normalizedTitle })
    updateBoardInRedux(updatedBoard)
    setIsLoadingTitle(false)
  }

  // Cập nhật board description
  const handleUpdateDescription = async () => {
    if (!currentBoard?._id) return

    const normalizedDescription = description?.trim()
    const currentDescription = currentBoard?.description?.trim()
    if (!normalizedDescription || normalizedDescription === currentDescription) return

    setIsLoadingDescription(true)
    const updatedBoard = await updateBoardDetailsAPI(currentBoard._id, { description: normalizedDescription })
    updateBoardInRedux(updatedBoard)
    setIsLoadingDescription(false)
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
