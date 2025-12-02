import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import AddToDriveIcon from '@mui/icons-material/AddToDrive'
import FilterListIcon from '@mui/icons-material/FilterList'
import Tooltip from '@mui/material/Tooltip'
import { capitalizeFirstLetter } from '~/utils/formatter'
import BoardUserGroup from './BoardUserGroup'
import InviteBoardUser from './InviteBoardUser'
import { CHIP_STYLE } from '~/thems'
import BoardSettings from './BoardSettings'

const BoardBar = ({ board }) => {
  return (
    <Box
      sx={{
        paddingX: 2,
        width: '100%',
        height: (theme) => theme.trello.boardBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        overflow: 'auto',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={board?.description}>
          <Chip sx={CHIP_STYLE} icon={<DashboardIcon />} label={board?.title} clickable />
        </Tooltip>

        <Chip sx={CHIP_STYLE} icon={<VpnLockIcon />} label={capitalizeFirstLetter(board?.type)} clickable />

        <Chip sx={CHIP_STYLE} icon={<AddToDriveIcon />} label="Add to Google Drive" clickable />

        <Chip sx={CHIP_STYLE} icon={<FilterListIcon />} label="Filters" clickable />

        {/* Settings board */}
        <BoardSettings board={board} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Xử lý mời user vào làm thành viên của board */}
        <InviteBoardUser boardId={board?._id} />

        {/* Xử lý hiển thị danh sách member của board */}
        <BoardUserGroup boardUsers={board?.FE_allUsers} />
      </Box>
    </Box>
  )
}

export default BoardBar
