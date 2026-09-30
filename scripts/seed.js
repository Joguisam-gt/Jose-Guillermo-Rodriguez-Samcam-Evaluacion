import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'job_portal_db';

const VACANCY_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};

const seedDatabase = async () => {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('[Seed] Conectado exitosamente a MongoDB...');
    const db = client.db(dbName);

    // 1. Limpiar colecciones previas
    await db.collection('candidates').deleteMany({});
    await db.collection('vacancies').deleteMany({});
    await db.collection('applications').deleteMany({});
    console.log('[Seed] Colecciones limpiadas.');

    // 2. Crear los 15 índices estratégicos (5 por colección)
    // Candidates Indexes
    await db.collection('candidates').createIndex({ email: 1 }, { unique: true });
    await db.collection('candidates').createIndex({ yearsOfExperience: -1, name: 1 });
    await db.collection('candidates').createIndex({ name: 'text' });
    await db.collection('candidates').createIndex({ createdAt: -1 });
    await db.collection('candidates').createIndex({ email: 1, name: 1 });

    // Vacancies Indexes
    await db.collection('vacancies').createIndex({ status: 1, minYearsOfExperience: 1 });
    await db.collection('vacancies').createIndex({ title: 'text' });
    await db.collection('vacancies').createIndex({ status: 1, createdAt: -1 });
    await db.collection('vacancies').createIndex({ title: 1, status: 1 });
    await db.collection('vacancies').createIndex({ minYearsOfExperience: 1, status: 1 });

    // Applications Indexes
    await db.collection('applications').createIndex({ score: -1, createdAt: 1 });
    await db.collection('applications').createIndex({ 'candidate.candidateId': 1, 'vacancy.vacancyId': 1, status: 1 });
    await db.collection('applications').createIndex({ status: 1, 'vacancy.vacancyId': 1, score: -1, createdAt: 1 });
    await db.collection('applications').createIndex({ priority: 1, status: 1 });
    await db.collection('applications').createIndex({ 'candidate.email': 1, createdAt: -1 });

    console.log('[Seed] Los 15 índices han sido creados correctamente.');

    // 3. Insertar Candidatos de Prueba
    const candidatesResult = await db.collection('candidates').insertMany([
      {
        _id: new ObjectId('6512a1b2c3d4e5f6a7b8c9d0'),
        name: 'Jose Rodriguez',
        email: 'jose.rodriguez@example.com',
        yearsOfExperience: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId('6512a1b2c3d4e5f6a7b8c9d1'),
        name: 'Maria Lopez',
        email: 'maria.lopez@example.com',
        yearsOfExperience: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId('6512a1b2c3d4e5f6a7b8c9d2'),
        name: 'Carlos Gomez',
        email: 'carlos.gomez@example.com',
        yearsOfExperience: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 4. Insertar Vacantes de Prueba (OPEN y CLOSED)
    const vacanciesResult = await db.collection('vacancies').insertMany([
      {
        _id: new ObjectId('6512a1b2c3d4e5f6a7b8c9e0'),
        title: 'Backend Developer Node.js',
        minYearsOfExperience: 3,
        status: VACANCY_STATUS.OPEN,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId('6512a1b2c3d4e5f6a7b8c9e1'),
        title: 'Frontend React Developer',
        minYearsOfExperience: 2,
        status: VACANCY_STATUS.CLOSED,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('[Seed] Datos iniciales insertados:');
    console.log(' - Candidatos:', candidatesResult.insertedCount);
    console.log(' - Vacantes:', vacanciesResult.insertedCount);

  } catch (error) {
    console.error('[Seed] Error durante la ejecución del script:', error.message);
  } finally {
    await client.close();
    console.log('[Seed] Proceso de siembra finalizado.');
  }
};

seedDatabase();