import { prisma } from './../src/lib/prisma'
async function seed() {
  await prisma.event.create({
    data: {
      id: '08265fc7-3989-43f7-97b8-43e911280619',
      title: 'Título do Evento de seed',
      slug: 'evento-de-seed',
      details: 'Bem vindo',
      maximumAttendees: 20
    }
  })
}

seed().then(() => {
  console.log('Database seeded!')
  prisma.$disconnect()
})
