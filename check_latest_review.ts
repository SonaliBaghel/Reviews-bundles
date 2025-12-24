import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const latestReview = await prisma.productReview.findFirst({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            images: true
        }
    });

    if (latestReview) {
        console.log(`Latest Review:`);
        console.log(`ID: ${latestReview.id}`);
        console.log(`Title: ${latestReview.title}`);
        console.log(`Content: ${latestReview.content}`);
        console.log(`Author: ${latestReview.author}`);
        console.log(`Created At: ${latestReview.createdAt}`);
        console.log(`Images: ${latestReview.images.length}`);
        latestReview.images.forEach(img => {
            console.log(`  - Image URL: ${img.url}`);
        });
    } else {
        console.log("No reviews found.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
