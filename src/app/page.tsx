import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await currentUser()

  if (!user) {
    redirect('/auth/sign-in')
  } else {
    redirect('/dashboard')
  }
}
