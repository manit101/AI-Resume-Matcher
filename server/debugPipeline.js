const { processJDPipeline } = require('./src/services/pipeline.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const jd = await prisma.jobDescription.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    if (!jd) return console.log("No JD");
    
    console.log("Testing pipeline for JD:", jd.id);
    await processJDPipeline(jd.id);
    console.log("Pipeline finished");
  } catch (err) {
    console.error("Test failed", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
