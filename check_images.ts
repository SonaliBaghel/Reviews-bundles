import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const reviewsWithImages = await prisma.productReview.findMany({
        where: {
            images: {
                some: {}
            }
        },
        include: {
            images: true
        }
    });

    console.log(`Found ${reviewsWithImages.length} reviews with images.`);
    reviewsWithImages.forEach(review => {
        console.log(`Review ID: ${review.id}, Images: ${review.images.length}`);
        review.images.forEach(img => {
            console.log(`  - Image URL: ${img.url}`);
        });
    });

    const totalImages = await prisma.reviewImage.count();
    console.log(`Total images in database: ${totalImages}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
