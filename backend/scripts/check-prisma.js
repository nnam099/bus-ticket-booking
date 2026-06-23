const prisma = require('../src/config/prisma');

const run = async () => {
    try {
        console.log('Prisma loaded:', !!prisma);
        console.log('Prisma keys:', Object.keys(prisma || {}));
        console.log('Has notification delegate:', !!(prisma && prisma.notification));
        process.exit(0);
    } catch (err) {
        console.error('Error loading prisma:', err);
        process.exit(1);
    }
};

run();
