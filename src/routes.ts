import { prisma } from "./prisma";
import express from "express";
import { convertHoursStringToMinutes } from "./utils/convertStringToMinutes";
import { convertMinutesToHoursString } from "./utils/convertMinutesToHoursString";

export const routes = express.Router();

routes.get("/games", async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return res.json(games);
});

routes.post("/games/:id/ads", async (req, res) => {
  const gameId = req.params.id;
  const body = req.body;

  if (!body.name) return res.status(400).send("Missing name field");
  if (body.yearsPlaying < 0)
    return res.status(400).send("Invalid Years Playing");
  if (!body.discord) return res.status(400).send("Missing discord field");
  if (!body.weekDays) return res.status(400).send("Missing weekDays field");
  if (!body.hourEnd) return res.status(400).send("Missing hourEnd field");
  if (!body.hourStart) return res.status(400).send("Missing hourStart field");

  const ad = await prisma.ad.create({
    data: {
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(","),
      hourEnd: convertHoursStringToMinutes(body.hourEnd),
      hourStart: convertHoursStringToMinutes(body.hourStart),
      useVoiceChannel: body.useVoiceChannel,
      gameId,
    },
  });

  return res.status(201).json(ad);
});

routes.get("/games/:id/ads", async (req, res) => {
  const gameId = req.params.id;
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      hourStart: true,
      hourEnd: true,
      yearsPlaying: true,
      discord: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Buscar do banco de dados o id especifico
  return res.json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(","),
        hourStart: convertMinutesToHoursString(ad.hourStart),
        hourEnd: convertMinutesToHoursString(ad.hourEnd),
      };
    })
  );
});

routes.get("/ads/:id/discord", async (req, res) => {
  const adId = req.params.id;
  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  // Buscar do banco de dados o id especifico
  return res.json(ad.discord);
});
