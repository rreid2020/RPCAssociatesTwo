import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDb, users } from '@shared/types/db';
import { eq } from 'drizzle-orm';
import { getAuth } from '@clerk/fastify';

// Schema for updating user profile
const updateProfileSchema = z.object({
  userType: z.enum(['business', 'individual']).nullable().optional(),
  employeeCount: z.enum(['1-10', '11-50', '51-250', '251+']).nullable().optional(),
});

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user profile
  fastify.get('/profile', async (request, reply) => {
    try {
      const { userId } = getAuth(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const db = getDb();
      
      // Find or create user record
      let userRecord = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (userRecord.length === 0) {
        // Create user record if it doesn't exist
        const [newUser] = await db
          .insert(users)
          .values({
            clerkUserId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        return reply.send({
          userType: newUser.userType || null,
          employeeCount: newUser.employeeCount || null,
        });
      }

      const user = userRecord[0];
      return reply.send({
        userType: user.userType || null,
        employeeCount: user.employeeCount || null,
      });
    } catch (error: any) {
      fastify.log.error('Error fetching user profile:', error);
      return reply.status(500).send({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user profile
  fastify.put('/profile', async (request, reply) => {
    try {
      const { userId } = getAuth(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const body = updateProfileSchema.parse(request.body);
      const db = getDb();

      // Find or create user record
      let userRecord = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (userRecord.length === 0) {
        // Create user record if it doesn't exist
        const [newUser] = await db
          .insert(users)
          .values({
            clerkUserId: userId,
            userType: body.userType || null,
            employeeCount: body.employeeCount || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        return reply.send({
          userType: newUser.userType || null,
          employeeCount: newUser.employeeCount || null,
        });
      }

      // Update existing user record
      const [updatedUser] = await db
        .update(users)
        .set({
          userType: body.userType !== undefined ? body.userType : userRecord[0].userType,
          employeeCount: body.employeeCount !== undefined ? body.employeeCount : userRecord[0].employeeCount,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkUserId, userId))
        .returning();

      return reply.send({
        userType: updatedUser.userType || null,
        employeeCount: updatedUser.employeeCount || null,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request data', details: error.errors });
      }
      fastify.log.error('Error updating user profile:', error);
      return reply.status(500).send({ error: 'Failed to update user profile' });
    }
  });
};
