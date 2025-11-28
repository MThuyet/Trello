/* eslint-disable no-console */
import express from 'express'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import cors from 'cors'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'

const START_SERVER = () => {
  const app = express()

  // fix call API (from disk cache)
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Sử dụng cookie-parser
  app.use(cookieParser())

  // config CORS
  app.use(cors(corsOptions))

  // Sử dụng JSON trong request
  app.use(express.json())

  // Ping endpoint ở mức root (không cần đi qua bất kỳ middleware phức tạp nào)
  app.get('/ping', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    })
  })

  // Sử dụng API v1
  app.use('/v1', APIs_V1)

  // Middleware xử lý lỗi tập trung
  app.use(errorHandlingMiddleware)

  if (env.BUILD_MODE === 'production') {
    // môi trường production ở Render
    app.listen(process.env.PORT, () => {
      console.log(`Hello ${env.AUTHOR}, I am running at Port ${process.env.PORT}`)
    })
  } else {
    // môi trường dev
    app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(`Hello ${env.AUTHOR}, I am running at http://${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}`)
    })
  }

  exitHook(() => {
    console.log('Closing DB...')
    CLOSE_DB()
    console.log('Closed DB successfully')
  })
}

;(async () => {
  try {
    console.log('Connecting to DB...')
    await CONNECT_DB()
    console.log('Connected to DB successfully')
    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()
