import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function getAttendeeBadge(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/attendees/:attendeeId/badge',
    {
      schema: {
        summary: 'Get an attendee badge',
        tags: ['attendees'],
        params: z.object({
          attendeeId: z.coerce.number().int()
        }),
        response: {
          200: z.object({
            badge: z.object({
              name: z.string(),
              email: z.string().email(),
              eventTitle: z.string(),
              checkInURL: z.string().url()
            })
          })
        }
      }
    },
    async (request, response) => {
      const { attendeeId } = request.params

      const attendee = await prisma.attendee.findUnique({
        select: {
          name: true,
          email: true,
          event: {
            select: {
              title: true
            }
          }
        },
        where: {
          id: attendeeId
        }
      })

      if (attendee === null) {
        throw new Error('Attendee not found')
      }

      const baseUrl = `${request.protocol}://${request.hostname}`

      const checkInUrl = new URL(`/attendees/${attendeeId}/check-in`, baseUrl)

      return response.send({
        badge: {
          name: attendee.name,
          email: attendee.email,
          eventTitle: attendee.event.title,
          checkInURL: checkInUrl.toString()
        }
      })
    }
  )
}
