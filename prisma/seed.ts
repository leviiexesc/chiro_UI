import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Chiro UI License Center database seed...");

  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || "admin";
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@chiro.local";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ERROR: INITIAL_ADMIN_PASSWORD environment variable is not set!");
    console.error("Please set INITIAL_ADMIN_PASSWORD in your environment or .env file.");
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {
      email: adminEmail,
      passwordHash: passwordHash,
      role: Role.SUPERADMIN,
    },
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash: passwordHash,
      role: Role.SUPERADMIN,
    },
  });

  console.log(`✅ Superadmin created/updated: ${admin.username} (${admin.email})`);

  // Default Products
  const products = [
    {
      name: "Chiro UI Pro Cyber",
      slug: "chiro-pro-cyber",
      description: "Full-featured Cyber UI suite with Game Hub, Job ID teleport, and real-time telemetry.",
      maxDevices: 1,
      defaultDurationDays: 30,
    },
    {
      name: "Chiro UI Lifetime",
      slug: "chiro-lifetime",
      description: "Permanent VIP access with unlimited updates, priority support, and multi-device slots.",
      maxDevices: 2,
      defaultDurationDays: null, // Lifetime
    },
    {
      name: "Chiro UI Developer License",
      slug: "chiro-developer",
      description: "Developer edition for script developers and hub creators with whitelist API access.",
      maxDevices: 5,
      defaultDurationDays: 365,
    },
  ];

  for (const prod of products) {
    const created = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        maxDevices: prod.maxDevices,
        defaultDurationDays: prod.defaultDurationDays,
      },
      create: prod,
    });
    console.log(`✅ Product seeded: ${created.name} (${created.slug})`);
  }

  console.log("🚀 Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
