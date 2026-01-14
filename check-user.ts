
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for admin user...')
  const user = await prisma.user.findUnique({
    where: { email: 'admin@mathsophos.com' },
  })
  if (user) {
    console.log('User found:', user.email, 'Role:', user.role)
    console.log('Password hash present:', !!user.passwordHash)
  } else {
    console.log('User NOT found.')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
