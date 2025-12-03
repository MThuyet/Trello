import Box from '@mui/material/Box'
import ModeSelect from '~/components/ModeSelect/ModeSelect'
import AppsIcon from '@mui/icons-material/Apps'
import SvgIcon from '@mui/icons-material/Apps'
import { ReactComponent as TrelloIcon } from '~/assets/trello.svg'
import Typography from '@mui/material/Typography'
import Workspaces from './Menus/Workspaces'
import Recent from './Menus/Recent'
import Starred from './Menus/Starred'
import Templates from './Menus/Templates'
import Tooltip from '@mui/material/Tooltip'
import Profiles from './Menus/Profiles'
import { Link } from 'react-router-dom'
import Notifications from '~/components/AppBar/Notifications/Notifications'
import AutoCompleteSearchBoard from '~/components/AppBar/SearchBoards/AutoCompleteSearchBoard'

const AppBar = () => {
  return (
    <Box
      px={2}
      sx={{
        width: '100%',
        height: (theme) => theme.trello.appBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        overflowX: 'auto',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2c3e50' : '#1565c0'),
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Trello Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SvgIcon component={TrelloIcon} fontSize="small" inheritViewBox sx={{ color: '#fff' }} />
          <Typography variant="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
            Trello
          </Typography>
        </Box>

        <Link to={'/boards'}>
          <Tooltip title="Board List">
            <AppsIcon sx={{ color: '#fff', verticalAlign: 'middle' }} />
          </Tooltip>
        </Link>

        {/* Menus */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Workspaces />
          <Recent />
          <Starred />
          <Templates />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AutoCompleteSearchBoard />

        <ModeSelect />

        <Notifications />

        {/* <Tooltip title="Help">
          <HelpOutlineIcon sx={{ cursor: 'pointer', color: '#fff' }} />
        </Tooltip> */}

        <Profiles />
      </Box>
    </Box>
  )
}

export default AppBar
