

import { prisma } from "@/lib/prisma";

export type CreateClientInput = {
  name: string;
  initials: string;
  email: string;
  image?: string;
};

export const clientRepository = {
  async getAll() {
    return prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        shoots: {
          orderBy: {
            date: "desc",
          },
          include: {
            galleries: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        shoots: {
          orderBy: {
            date: "desc",
          },
          include: {
            galleries: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });
  },

  async getByEmail(email: string) {
    return prisma.client.findUnique({
      where: { email },
    });
  },

  async create(input: CreateClientInput) {
    return prisma.client.create({
      data: {
        name: input.name,
        initials: input.initials,
        email: input.email,
        image: input.image,
      },
    });
  },
};