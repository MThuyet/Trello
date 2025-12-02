import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { useConfirm } from 'material-ui-confirm'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'

const BoardMembersList = () => {
  const dispach = useDispatch()
  const board = useSelector(selectCurrentActiveBoard)
  const currentUser = useSelector(selectCurrentUser)
  const allUsers = board?.FE_allUsers

  const confirm = useConfirm()
  const handleRemoveMember = (memberId, memberName) => {
    // Không cho phép xóa chính mình nếu là owner duy nhất
    const owners = board?.owners || []
    const isOwner = owners.some((owner) => owner._id === memberId)

    if (isOwner && owners.length === 1) {
      dispach(showSnackbar({ message: 'Cannot remove the only owner of the board', severity: 'error' }))
      return
    }

    confirm({
      title: (
        <span>
          Remove member &quot;<b>{memberName}</b>&quot; from board?
        </span>
      ),
      description: 'This member will no longer have access to this board.',
      confirmationText: 'Remove',
      cancellationText: 'Cancel',
      confirmationButtonProps: { color: 'error' },
    })
      .then(() => {
        console.log(memberId)
      })
      .catch(() => {})
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: '600', mb: 2, color: 'primary.main' }}>
        Board Members
      </Typography>

      {allUsers?.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No members in this board
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {allUsers?.map((user) => {
            const isOwner = board?.owners?.some((owner) => owner._id === user._id)
            const isCurrentUserMember = user._id === currentUser._id
            // Kiểm tra xem currentUser có phải là owner không
            const isCurrentUserOwner = board?.owners?.some((owner) => owner._id === currentUser._id)
            // Chỉ hiển thị nút xóa nếu:
            // 1. currentUser là owner (chỉ owner mới có quyền xóa)
            // 2. Không phải trường hợp xóa owner duy nhất (phải có ít nhất 1 owner)
            const isOnlyOwner = isOwner && board?.owners?.length === 1
            const canRemove = isCurrentUserOwner && !isOnlyOwner

            return (
              <Box
                key={user._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: '4px',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2f3542' : '#f5f5f5'),
                  '&:hover': {
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#33485D' : '#e9e9e9'),
                  },
                }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar alt={user.displayName} src={user.avatar} sx={{ width: 40, height: 40 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>
                      {user.displayName}
                      {isCurrentUserMember && (
                        <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          (You)
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isOwner ? 'Owner' : 'Member'}
                    </Typography>
                  </Box>
                </Box>

                {/* Nút xóa thành viên - chỉ hiển thị nếu currentUser là owner */}
                {canRemove && (
                  <Tooltip title={isOwner ? 'Remove owner' : 'Remove member'}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMember(user._id, user.displayName)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'white',
                        },
                      }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export default BoardMembersList
