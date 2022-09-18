import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { convertHourToMinutes } from './utils/convert-hours-to-minutes';
import { convertMinutesToHours } from './utils/convert-minutes-to-hours';

const app = express();
app.use(express.json());
app.use(cors());
const prisma = new PrismaClient({
    log: ['query']
});

app.get('/games', async (req, res) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    });
    return res.json(games);
});

app.get('/ads', (req, res) => {
    return res.json([]);
});

app.post('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;
    const body: any = req.body;

    const ad = await prisma.ad.create({
        data: {
            gameId: gameId,
            name: body.name,
            weekDays: body.weekDays.join(','),
            useVoiceChannel: body.useVoiceChannel,
            hourStart: convertHourToMinutes(body.hourStart),
            hourEnd: convertHourToMinutes(body.hourEnd),
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
        }
    })

    return res.status(201).json(ad);
});

app.get('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            hourStart: true,
            hourEnd: true,
            yearsPlaying: true
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    return res.json(ads.map(ads => {
        const gameId = req.params.id;
        return {
            ...ads,
            weekDays: ads.weekDays.split(','),
            hourStart: convertMinutesToHours(ads.hourStart),
            hourEnd: convertMinutesToHours(ads.hourEnd),
        }
    }));
});

app.get('/ads/:id/discord', async (req, res) => {
    const adId = req.params.id;
    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        }
    });
    return res.json({
        discord: ad.discord
    }
    );
});

app.listen(3333);