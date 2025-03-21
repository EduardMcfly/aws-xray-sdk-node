const { PrismaClient } = require('@prisma/client');
const awsXray = require('aws-xray-sdk-core');
const { capturePrisma } = require('aws-xray-sdk-prisma');

awsXray.enableManualMode();

const prisma = new PrismaClient();

const client = capturePrisma(prisma, { namespace: 'remote' });

const segment = new awsXray.Segment('prisma-xray-sample');

const run = async () => {
  const subSegment = segment.addNewSubsegment('Prisma');

  await client.company.upsert(
    {
      create: {
        name: 'Prisma',
        createdAt: new Date(),
      },
      update: {},
      where: {
        id: 1,
      },
    },
    // @ts-ignore
    subSegment
  );
  const companies = await client.company.findMany(
    // @ts-ignore
    subSegment
  );
  console.log(companies);
  subSegment.close();
  const timeout = segment.addNewSubsegment('timeout');
  setTimeout(() => {
    timeout.close();
    segment.close();
  }, 1000);
  prisma.$disconnect();
};

run();
