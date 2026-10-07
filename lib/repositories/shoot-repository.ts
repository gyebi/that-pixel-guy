
import { prisma } from "@/lib/prisma";

export type CreateShootInput = {
  clientId: string;
  name: string;
  date: Date;
};

export const shootRepository = {
  async getById(id: string) {
    return prisma.shoot.findUnique({
      where: { id },
      include: {
        client: true,
        galleries: true,
        photos: true,
      },
    });
  },

  async getForClient(clientId: string) {
    return prisma.shoot.findMany({
      where: {
        clientId,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        galleries: true,
      },
    });
  },

  async create(input: CreateShootInput) {
    return prisma.shoot.create({
      data: {
        clientId: input.clientId,
        name: input.name,
        date: input.date,
      },
    });
  },
};
