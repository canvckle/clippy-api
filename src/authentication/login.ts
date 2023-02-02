import { getAuth } from 'firebase-admin/auth'

const verifyToken = async (token: string) => {
  try {
    console.log(token)
    const user = await getAuth().verifyIdToken(token)
    console.log(user)
    return user.uid
  }
  catch (error) {
    console.error(error)
    return null
  }
}

export { verifyToken };