import { env } from '~/config/environment'

import { MongoClient, ServerApiVersion } from 'mongodb'

let trelloDatabaseInstance = null

const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

// Kết nối tới db
export const CONNECT_DB = async () => {
  // Gọi kết nối tới MongoDB Atlas với URI đã khai báo
  await mongoClientInstance.connect()
  // Kết nối thành công thì lấy ra DB theo tên và gán ngược nó lại vào biến
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

// đóng kết nối DB khi cần
export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
}

// function có nhiệm vụ export ra trelloDatabaseInstance sau khi đã connect thành công tới MG để chúng ta sử dụng ở nhiều nơi khác nhau trong code
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('You must connect to DB first')
  return trelloDatabaseInstance
}
