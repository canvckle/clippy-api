import { getAuth } from 'firebase-admin/auth'

const verifyToken = async (token: string) => {
  try {
    const user = await getAuth().verifyIdToken(token)
    return user.uid
  }
  catch (error) {
    console.error(error)
    return null
  }
}

export { verifyToken };