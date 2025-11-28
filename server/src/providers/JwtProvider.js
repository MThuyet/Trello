import JWT from 'jsonwebtoken'

/* \
	function tạo jwt token - cần 3 tham số đầu vào
	userInfo: những thông tin muốn đính kèm vào token
	sercretSignature: chữ ký
	tokenLifetime: thời gian sống
*/
const genegrateToken = async (userInfo, secretSignature, tokenLifetime) => {
  try {
    // hàm sigt() để tạo chữ ký, thuật toán mặc định của nó là HS256
    return JWT.sign(userInfo, secretSignature, { expiresIn: tokenLifetime })
  } catch (error) {
    throw new Error(error)
  }
}

/*
	function kiểm tra token có hợp lệ hay không
	hợp lệ ở đây là token được sinh ra có chữ ký đúng với sercretSignature
*/
const verifyToken = async (token, secretSignature) => {
  try {
    // hàm verify() để kiểm tra token hợp lệ hay không
    return JWT.verify(token, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  genegrateToken,
  verifyToken
}
