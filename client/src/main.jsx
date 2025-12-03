import ReactDOM from 'react-dom/client'
import App from '~/App.jsx'
// MUI
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { ThemeProvider } from '@mui/material/styles'
import theme from '~/thems.js'
// material-ui-confirm
import { ConfirmProvider } from 'material-ui-confirm'
// redux
import { Provider } from 'react-redux'
import { store } from './redux/store'
// react router dom
import { BrowserRouter } from 'react-router-dom'
// redux persist
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
// axios injectStore
import { injectStore } from './utils/authorizeAxios'

// tiêm store vào axios
injectStore(store)

let persistor = persistStore(store)

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {/*basename: đường dẫn gốc của project, luôn luôn phải đi qua trước khi truy cập vào các route khác */}
      <BrowserRouter basename="/">
        <ThemeProvider theme={theme}>
          <ConfirmProvider
            defaultOptions={{
              dialogProps: { maxWidth: 'xs' },
              cancellationButtonProps: { color: 'inherit' },
              confirmationButtonProps: { variant: 'outlined' },
              allowClose: false,
            }}>
            <GlobalStyles styles={{ a: { textDecoration: 'none' } }} />
            <CssBaseline />
            <App />
          </ConfirmProvider>
        </ThemeProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>,
)
