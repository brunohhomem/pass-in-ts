import { Attendee } from './../../node_modules/.prisma/client/index.d'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { BadRequest } from './_errors/bad-request'

export async function registerForEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/events/:eventId/attendees',
    {
      schema: {
        summary: 'Register an attendee',
        tags: ['attendees'],
        body: z.object({
          name: z.string().min(4),
          email: z.string().email()
        }),
        params: z.object({
          eventId: z.string().uuid()
        }),
        response: {
          201: z.object({
            attendeeId: z.number()
          })
        }
      }
    },
    async (request, response) => {
      const { eventId } = request.params
      const { name, email } = request.body

      const attendeeFromEmail = await prisma.attendee.findUnique({
        where: {
          eventId_email: {
            email,
            eventId
          }
        }
      })

      if (attendeeFromEmail !== null) {
        throw new BadRequest('This e-mail is already registered for this event')
      }

      //Roda queries simultâneas no banco de dados
      const [event, amountOfAttendeesForEvent] = await Promise.all([
        prisma.event.findUnique({
          where: {
            id: eventId
          }
        }),

        await prisma.attendee.count({
          where: {
            eventId
          }
        })
      ])

      if (
        event?.maximumAttendees &&
        amountOfAttendeesForEvent > event?.maximumAttendees
      ) {
        throw new BadRequest(
          'The maximum number of attendees for this event has been reached.'
        )
      }

      const attendee = await prisma.attendee.create({
        data: {
          name,
          email,
          eventId
        }
      })

      return response.status(201).send({ attendeeId: attendee.id })
    }
  )
}
