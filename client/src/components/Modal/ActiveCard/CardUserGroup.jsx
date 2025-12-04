import { useState } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import AddIcon from '@mui/icons-material/Add'
import Badge from '@mui/material/Badge'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useSelector } from 'react-redux'
import { selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { ACTION_UPDATE_CARD_MEMBERS } from '~/utils/constants'

const CardUserGroup = ({ cardMemberIds = [], onUpdateCardMemberIds }) => {
  // Xử lý Popover để ẩn hoặc hiện toàn bộ user trên một popup
  const [anchorPopoverElement, setAnchorPopoverElement] = useState(null)
  const isOpenPopover = Boolean(anchorPopoverElement)
  const popoverId = isOpenPopover ? 'card-all-users-popover' : undefined
  const handleTogglePopover = (event) => {
    if (!anchorPopoverElement) setAnchorPopoverElement(event.currentTarget)
    else setAnchorPopoverElement(null)
  }

  const [isLoadingUpdateCardMembers, setIsLoadingUpdateCardMembers] = useState(false)

  // lấy được toàn bộ thông tin những thành viên của board thông qua field FE_allUsers
  const board = useSelector(selectCurrentActiveBoard)
  // thành viên trong card sẽ phải là tập con của thành viên trong board
  // dựa vào FE_allUsers và cardMemberIds, tạo ra cardMembers chứa toàn bộ thông tin của user trong card vì card chỉ lưu memberIds
  const cardMembers = board.FE_allUsers?.filter((user) => cardMemberIds.includes(user._id))

  const handleUpdateCardMembers = (member) => {
    setIsLoadingUpdateCardMembers(true)
    // tạo biến incommingMemberInfo để gửi cho BE, với 2 thông tin chính là memberId và action xóa hoặc thêm
    const incommingMemberInfo = {
      memberId: member._id,
      action: cardMemberIds.includes(member._id) ? ACTION_UPDATE_CARD_MEMBERS.REMOVE : ACTION_UPDATE_CARD_MEMBERS.ADD,
    }

    // call api update card members
    onUpdateCardMemberIds(incommingMemberInfo).then(() => setIsLoadingUpdateCardMembers(false))
  }

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {/* Hiển thị các user là thành viên của card */}
      {cardMembers.map((member) => (
        <Tooltip title={member.displayName} key={member._id}>
          <Avatar sx={{ width: 34, height: 34, cursor: 'pointer' }} alt={member.displayName} src={member.avatar} />
        </Tooltip>
      ))}

      {/* Nút này để mở popover thêm member */}
      <Tooltip title="Add new member">
        <Box
          aria-describedby={popoverId}
          onClick={handleTogglePopover}
          sx={{
            width: 36,
            height: 36,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '50%',
            color: (theme) => (theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d'),
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2f3542' : theme.palette.grey[200]),
            '&:hover': {
              color: (theme) => (theme.palette.mode === 'dark' ? '#000000de' : '#0c66e4'),
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#90caf9' : '#e9f2ff'),
            },
          }}>
          <AddIcon fontSize="small" />
        </Box>
      </Tooltip>

      {/* Khi Click vào + ở trên thì sẽ mở popover hiện toàn bộ users trong board để người dùng Click chọn thêm vào card  */}
      <Popover
        id={popoverId}
        open={isOpenPopover}
        anchorEl={anchorPopoverElement}
        onClose={handleTogglePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{ p: 2, maxWidth: '260px', display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {board.FE_allUsers.map((member) => (
            <Tooltip title={member.displayName} key={member._id}>
              {/* Avatar kèm badge icon: https://mui.com/material-ui/react-avatar/#with-badge */}
              <Badge
                className={`${isLoadingUpdateCardMembers ? 'interceptor-loading' : ''}`}
                sx={{ cursor: 'pointer' }}
                overlap="rectangular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={cardMemberIds.includes(member._id) ? <CheckCircleIcon fontSize="small" sx={{ color: '#27ae60' }} /> : null}
                onClick={() => handleUpdateCardMembers(member)}>
                <Avatar sx={{ width: 34, height: 34 }} alt={member.displayName} src={member.avatar} />
              </Badge>
            </Tooltip>
          ))}
        </Box>
      </Popover>
    </Box>
  )
}

export default CardUserGroup
