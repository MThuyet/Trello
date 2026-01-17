import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CancelIcon from '@mui/icons-material/Cancel'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
// import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
// import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined'
// import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
// import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined'
import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined'
import AddToDriveOutlinedIcon from '@mui/icons-material/AddToDriveOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import SubjectRoundedIcon from '@mui/icons-material/SubjectRounded'
import DvrOutlinedIcon from '@mui/icons-material/DvrOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import CloseIcon from '@mui/icons-material/Close'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import VisuallyHiddenInput from '~/components/Form/VisuallyHiddenInput'
import { singleFileValidator } from '~/utils/validators'

import CardUserGroup from './CardUserGroup'
import CardDescriptionMdEditor from './CardDescriptionMdEditor'
import CardActivitySection from './CardActivitySection'
import { LabelChip, LabelPicker } from '~/components/Label'

import { styled } from '@mui/material/styles'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearAndHideCurrentActiveCard,
  selectCurrentActiveCard,
  updateCurrentActiveCard,
  selectIsShowModalActiveCard,
  updateCardLabels,
} from '~/redux/activeCard/activeCardSlice'
import { deleteOneCardAPI, updateCardDetailsAPI, addLabelToCardAPI, updateCardLabelAPI, removeLabelFromCardAPI } from '~/apis'
import { updateCardInBoard, updateCardLabelsInBoard } from '~/redux/activeBoard/activeBoardSlice'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { ACTION_UPDATE_CARD_MEMBERS } from '~/utils/constants'
import { useConfirm } from 'material-ui-confirm'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'
import { useState } from 'react'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'

// style sidebar - responsive
const SidebarItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  color: theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d',
  backgroundColor: theme.palette.mode === 'dark' ? '#2f3542' : '#091e420f',
  padding: '10px 12px',
  borderRadius: '8px',
  minHeight: '44px', // Touch target tối thiểu
  transition: 'all 0.15s ease',
  WebkitTapHighlightColor: 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#33485D' : theme.palette.grey[300],
    '&.active': {
      color: theme.palette.mode === 'dark' ? '#000000de' : '#0c66e4',
      backgroundColor: theme.palette.mode === 'dark' ? '#90caf9' : '#e9f2ff',
    },
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  // Responsive
  [theme.breakpoints.down('sm')]: {
    fontSize: '16px',
    padding: '14px 16px',
    minHeight: '52px',
    borderRadius: '12px',
    gap: '12px',
  },
}))

function ActiveCard() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const activeCard = useSelector(selectCurrentActiveCard)
  const isShowModalActiveCard = useSelector(selectIsShowModalActiveCard)
  const [isLoadingTitle, setIsLoadingTitle] = useState(false)
  const [isLoadingJoinCard, setIsLoadingJoinCard] = useState(false)
  const [isLoadingUploadCover, setIsLoadingUploadCover] = useState(false)
  const [isDeleteCard, setIsDeleteCard] = useState(false)

  // Label picker state
  const [labelAnchorEl, setLabelAnchorEl] = useState(null)
  const labelPickerOpen = Boolean(labelAnchorEl)

  const handleCloseModal = () => {
    dispatch(clearAndHideCurrentActiveCard())
  }

  // ==================== LABEL HANDLERS ====================
  const handleOpenLabelPicker = (event) => {
    setLabelAnchorEl(event.currentTarget)
  }

  const handleCloseLabelPicker = () => {
    setLabelAnchorEl(null)
  }

  const handleAddLabel = async (labelData) => {
    try {
      const updatedCard = await addLabelToCardAPI(activeCard._id, labelData)
      dispatch(updateCardLabels(updatedCard.labels))
      dispatch(
        updateCardLabelsInBoard({
          cardId: activeCard._id,
          columnId: activeCard.columnId,
          labels: updatedCard.labels,
        }),
      )
    } catch (error) {
      dispatch(showSnackbar({ message: error.response?.data?.message || 'Failed to add label', severity: 'error' }))
    }
  }

  const handleUpdateLabel = async (labelId, labelData) => {
    try {
      const updatedCard = await updateCardLabelAPI(activeCard._id, labelId, labelData)
      dispatch(updateCardLabels(updatedCard.labels))
      dispatch(
        updateCardLabelsInBoard({
          cardId: activeCard._id,
          columnId: activeCard.columnId,
          labels: updatedCard.labels,
        }),
      )
    } catch (error) {
      dispatch(showSnackbar({ message: error.response?.data?.message || 'Failed to update label', severity: 'error' }))
    }
  }

  const handleRemoveLabel = async (labelId) => {
    try {
      const updatedCard = await removeLabelFromCardAPI(activeCard._id, labelId)
      dispatch(updateCardLabels(updatedCard.labels))
      dispatch(
        updateCardLabelsInBoard({
          cardId: activeCard._id,
          columnId: activeCard.columnId,
          labels: updatedCard.labels,
        }),
      )
    } catch (error) {
      dispatch(showSnackbar({ message: error.response?.data?.message || 'Failed to remove label', severity: 'error' }))
    }
  }

  const callApiUpdateCard = async (updateData) => {
    const updatedCard = await updateCardDetailsAPI(activeCard._id, updateData)

    // b1 cập nhật lại card đang active trong modal hiện tại
    dispatch(updateCurrentActiveCard(updatedCard))

    // b2 cập nhật lại bản ghi card trong activeBoard
    dispatch(updateCardInBoard(updatedCard))
    return updatedCard
  }

  const onUpdateCardTitle = async (newTitle) => {
    try {
      if (newTitle.length < 3 || newTitle.length > 50) {
        dispatch(showSnackbar({ message: 'Card title must be between 3 and 50 characters', severity: 'error' }))
        return false
      }

      setIsLoadingTitle(true)
      await callApiUpdateCard({ title: newTitle.trim() })
      return true
    } catch (error) {
      return false
    } finally {
      setIsLoadingTitle(false)
    }
  }

  const onUpdateCardDescription = (newDescription) => {
    callApiUpdateCard({ description: newDescription })
  }

  const onUploadCardCover = async (event) => {
    const error = singleFileValidator(event.target?.files[0])
    if (error) {
      dispatch(showSnackbar({ message: error, severity: 'error' }))
      return
    }
    let reqData = new FormData()
    reqData.append('cover', event.target?.files[0])

    // call api
    try {
      setIsLoadingUploadCover(true)
      await callApiUpdateCard(reqData)
      dispatch(showSnackbar({ message: 'Upload cover successfully!', severity: 'success' }))
    } catch (error) {
      console.log(error.message)
    } finally {
      event.target.value = ''
      setIsLoadingUploadCover(false)
    }
  }

  // dùng async await để component con CardActivitySection chờ và thành công thì mới clear input value
  const onAddCardComment = async (commentToAdd) => {
    await callApiUpdateCard({ commentToAdd })
  }

  const onDeleteCardComment = async (commentToDelete) => {
    await callApiUpdateCard({ commentToDelete })
  }

  const onUpdateCardMemberIds = (incomingMemberInfo) => {
    callApiUpdateCard({ incomingMemberInfo })
  }

  // delete card
  const confirmDeleteCard = useConfirm()
  const onDeleteCard = (cardId) => {
    confirmDeleteCard({
      title: (
        <span>
          Delete Card &quot;<b>{activeCard?.title}</b>&quot;?
        </span>
      ),
      description: <span>This action will permanently delete your Card!</span>,
      confirmationText: 'Delete Card',
      cancellationText: 'Cancel',
      confirmationButtonProps: { color: 'error' },
    })
      .then(async () => {
        try {
          setIsDeleteCard(true)
          await deleteOneCardAPI(cardId)
          dispatch(clearAndHideCurrentActiveCard())
          dispatch(showSnackbar({ message: 'Deleted card successfully!', severity: 'success' }))
        } catch (error) {
          console.log(error.message)
        } finally {
          setIsDeleteCard(false)
        }
      })
      .catch(() => {})
  }

  return (
    <Modal
      open={isShowModalActiveCard}
      onClose={handleCloseModal}
      sx={{
        overflowY: 'auto',
        // Mobile: full screen modal
        '& .MuiBackdrop-root': {
          backgroundColor: { xs: 'rgba(0,0,0,0.8)', sm: 'rgba(0,0,0,0.5)' },
        },
      }}
    >
      {isDeleteCard ? (
        <PageLoadingSpinner />
      ) : (
        <Box
          sx={{
            position: 'relative',
            // Responsive width
            width: { xs: '100%', sm: '100%', md: 900 },
            maxWidth: { xs: '100%', sm: '95%', md: 900 },
            // Responsive height
            minHeight: { xs: '100vh', sm: 'auto' },
            bgcolor: 'white',
            boxShadow: 24,
            // Responsive border radius
            borderRadius: { xs: 0, sm: '12px' },
            border: 'none',
            outline: 0,
            // Responsive padding
            padding: { xs: '56px 16px 24px', sm: '40px 20px 20px' },
            // Responsive margin
            margin: { xs: 0, sm: '30px auto' },
            backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#1A2027' : '#fff'),
            // Mobile safe area
            paddingBottom: { xs: 'calc(24px + env(safe-area-inset-bottom))', sm: '20px' },
          }}
        >
          {/* Close Button - Responsive */}
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: { xs: 8, sm: 8 },
              right: { xs: 8, sm: 8 },
              minWidth: { xs: 44, sm: 36 },
              minHeight: { xs: 44, sm: 36 },
              backgroundColor: { xs: 'rgba(0,0,0,0.1)', sm: 'transparent' },
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.15)',
              },
            }}
          >
            {isMobile ? <CloseIcon /> : <CancelIcon color="error" />}
          </IconButton>

          {/* Cover Image - Responsive */}
          {activeCard?.cover && (
            <Box sx={{ mb: { xs: 2, sm: 4 }, mx: { xs: -2, sm: 0 } }}>
              <img
                style={{
                  width: '100%',
                  height: isMobile ? '200px' : '320px',
                  borderRadius: isMobile ? 0 : '6px',
                  objectFit: 'cover',
                }}
                src={activeCard?.cover}
                alt={activeCard?.title}
              />
            </Box>
          )}

          {/* Card Title - Responsive */}
          <Box
            sx={{
              mb: { xs: 2, sm: 1 },
              mt: { xs: 0, sm: -3 },
              pr: { xs: 0, sm: 2.5 },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CreditCardIcon sx={{ fontSize: { xs: 28, sm: 24 } }} />
            {/* Feature 01: Xử lý tiêu đề của Card */}
            <ToggleFocusInput
              disabled={isLoadingTitle}
              inputFontSize={isMobile ? '20px' : '22px'}
              value={activeCard?.title}
              onChangedValue={onUpdateCardTitle}
            />
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: 3 }}>
            {/* Left side - Main Content */}
            <Grid size={{ xs: 12, sm: 9 }} order={{ xs: 2, sm: 1 }}>
              <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    color: 'primary.main',
                    mb: 1,
                    fontSize: { xs: '16px', sm: '14px' },
                  }}
                >
                  Members
                </Typography>

                {/* Feature 02: Xử lý các thành viên của Card */}
                <CardUserGroup cardMemberIds={activeCard?.memberIds} onUpdateCardMemberIds={onUpdateCardMemberIds} />
              </Box>

              {/* Labels Section - Responsive */}
              <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    color: 'primary.main',
                    mb: 1,
                    fontSize: { xs: '16px', sm: '14px' },
                  }}
                >
                  Labels
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: { xs: 1, sm: 0.5 },
                    alignItems: 'center',
                  }}
                >
                  {activeCard?.labels?.map((label) => (
                    <LabelChip key={label._id} label={label} size="large" onClick={handleOpenLabelPicker} />
                  ))}
                  {/* Add Label Button - Responsive */}
                  <Box
                    onClick={handleOpenLabelPicker}
                    sx={{
                      height: { xs: 40, sm: 32 },
                      width: { xs: 40, sm: 32 },
                      backgroundColor: '#091e420f',
                      borderRadius: { xs: '8px', sm: '4px' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { backgroundColor: '#091e4224' },
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                  >
                    <AddOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SubjectRoundedIcon sx={{ fontSize: { xs: 26, sm: 24 } }} />
                  <Typography
                    variant="span"
                    sx={{ fontWeight: '600', fontSize: { xs: '18px', sm: '20px' } }}
                  >
                    Description
                  </Typography>
                </Box>

                {/* Feature 03: Xử lý mô tả của Card */}
                <CardDescriptionMdEditor
                  cardDescriptionProp={activeCard?.description}
                  handleUpdateCardDescription={onUpdateCardDescription}
                />
              </Box>

              <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DvrOutlinedIcon sx={{ fontSize: { xs: 26, sm: 24 } }} />
                  <Typography
                    variant="span"
                    sx={{ fontWeight: '600', fontSize: { xs: '18px', sm: '20px' } }}
                  >
                    Activity
                  </Typography>
                </Box>

                {/* Feature 04: Xử lý các hành động, ví dụ comment vào Card */}
                <CardActivitySection
                  cardComments={activeCard?.comments}
                  onAddCardComment={onAddCardComment}
                  onDeleteCardComment={onDeleteCardComment}
                />
              </Box>
            </Grid>

            {/* Right side - Sidebar (hiện trước trên mobile) */}
            <Grid size={{ xs: 12, sm: 3 }} order={{ xs: 1, sm: 2 }}>
              <Typography
                sx={{
                  fontWeight: '600',
                  color: 'primary.main',
                  mb: 1,
                  fontSize: { xs: '16px', sm: '14px' },
                }}
              >
                Add To Card
              </Typography>
              <Stack direction="column" spacing={{ xs: 1.5, sm: 1 }}>
                {/* Feature 05: Xử lý hành động bản thân user tự join vào card */}
                {/* Nếu user hiện tại đang đăng nhập mà chưa join vào card thì hiện nút join */}
                {!activeCard?.memberIds?.includes(currentUser._id) && (
                  <SidebarItem
                    onClick={() => {
                      setIsLoadingJoinCard(true)
                      onUpdateCardMemberIds({ memberId: currentUser._id, action: ACTION_UPDATE_CARD_MEMBERS.ADD }).then(() =>
                        setIsLoadingJoinCard(false),
                      )
                    }}
                    className={`active ${isLoadingJoinCard ? 'interceptor-loading' : ''}`}
                  >
                    <PersonOutlineOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                    Join
                  </SidebarItem>
                )}

                {/* Feature 06: Xử lý hành động cập nhật ảnh Cover của Card */}
                <SidebarItem className={`active ${isLoadingUploadCover ? 'interceptor-loading' : ''}`} component="label">
                  <ImageOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Cover
                  <VisuallyHiddenInput type="file" onChange={onUploadCardCover} />
                </SidebarItem>

                {/* Feature 07: Xử lý Labels */}
                <SidebarItem className="active" onClick={handleOpenLabelPicker}>
                  <LocalOfferOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Labels
                </SidebarItem>

                {/* <SidebarItem>
                <AttachFileOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                Attachment
              </SidebarItem>
              <SidebarItem>
                <TaskAltOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                Checklist
              </SidebarItem>
              <SidebarItem>
                <WatchLaterOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                Dates
              </SidebarItem>
              <SidebarItem>
                <AutoFixHighOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                Custom Fields
              </SidebarItem> */}
              </Stack>

              <Divider sx={{ my: { xs: 2.5, sm: 2 } }} />

              <Typography
                sx={{
                  fontWeight: '600',
                  color: 'primary.main',
                  mb: 1,
                  fontSize: { xs: '16px', sm: '14px' },
                }}
              >
                Power-Ups
              </Typography>
              <Stack direction="column" spacing={{ xs: 1.5, sm: 1 }}>
                <SidebarItem>
                  <AspectRatioOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Card Size
                </SidebarItem>
                <SidebarItem>
                  <AddToDriveOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Google Drive
                </SidebarItem>
                <SidebarItem>
                  <AddOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Add Power-Ups
                </SidebarItem>
              </Stack>

              <Divider sx={{ my: { xs: 2.5, sm: 2 } }} />

              <Typography
                sx={{
                  fontWeight: '600',
                  color: 'primary.main',
                  mb: 1,
                  fontSize: { xs: '16px', sm: '14px' },
                }}
              >
                Actions
              </Typography>
              <Stack direction="column" spacing={{ xs: 1.5, sm: 1 }}>
                <SidebarItem>
                  <ArrowForwardOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Move
                </SidebarItem>
                <SidebarItem>
                  <ContentCopyOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Copy
                </SidebarItem>
                <SidebarItem>
                  <ArchiveOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Archive
                </SidebarItem>
                <SidebarItem>
                  <ShareOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Share
                </SidebarItem>
                <SidebarItem onClick={() => onDeleteCard(activeCard._id)}>
                  <DeleteOutlinedIcon fontSize={isMobile ? 'medium' : 'small'} />
                  Delete
                </SidebarItem>
              </Stack>
            </Grid>
          </Grid>

          {/* Label Picker Popover */}
          <LabelPicker
            anchorEl={labelAnchorEl}
            open={labelPickerOpen}
            onClose={handleCloseLabelPicker}
            currentLabels={activeCard?.labels || []}
            onAddLabel={handleAddLabel}
            onUpdateLabel={handleUpdateLabel}
            onRemoveLabel={handleRemoveLabel}
          />
        </Box>
      )}
    </Modal>
  )
}

export default ActiveCard
