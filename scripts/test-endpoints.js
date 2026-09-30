import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

const log = (title, success, detail = '') => {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${title}`);
  if (detail) console.log(`   └─ ${detail}\n`);
};

async function runTests() {
  console.log('\n🚀 Iniciando suite de pruebas e2e para Endpoints...\n');

  let createdAppId = null;
  const token = jwt.sign({ id: 'admin123', role: 'RECRUITER' }, JWT_SECRET, { expiresIn: '1h' });

  // 1. POST /applications - Creación Exitosa
  try {
    const res = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: '6512a1b2c3d4e5f6a7b8c9d0',
        vacancyId: '6512a1b2c3d4e5f6a7b8c9e0',
        source: 'REFERRAL',
        coverLetter: 'Tengo 4 años de experiencia construyendo APIs REST con Node.js y bases de datos SQL.'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data._id) {
      createdAppId = data._id;
      log('1. POST /applications (Creación exitosa - 201)', true, `ID: ${createdAppId} | Score: ${data.score} | Priority: ${data.priority}`);
    } else {
      log('1. POST /applications (Creación exitosa)', false, `Status: ${res.status} | Res: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log('1. POST /applications (Creación exitosa)', false, e.message);
  }

  // 2. POST /applications - Control de Duplicidad (409)
  try {
    const res = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: '6512a1b2c3d4e5f6a7b8c9d0',
        vacancyId: '6512a1b2c3d4e5f6a7b8c9e0',
        source: 'REFERRAL',
        coverLetter: 'Intento duplicado.'
      })
    });
    const data = await res.json();
    if (res.status === 409) {
      log('2. POST /applications (Bloqueo por Duplicidad - 409)', true, data.error?.message);
    } else {
      log('2. POST /applications (Bloqueo por Duplicidad)', false, `Status inesperado: ${res.status}`);
    }
  } catch (e) {
    log('2. POST /applications (Bloqueo por Duplicidad)', false, e.message);
  }

  // 3. POST /applications - Vacante Cerrada (400)
  try {
    const res = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: '6512a1b2c3d4e5f6a7b8c9d1',
        vacancyId: '6512a1b2c3d4e5f6a7b8c9e1',
        source: 'JOB_BOARD',
        coverLetter: 'Postulación a vacante cerrada.'
      })
    });
    const data = await res.json();
    if (res.status === 400) {
      log('3. POST /applications (Bloqueo Vacante Cerrada - 400)', true, data.error?.message);
    } else {
      log('3. POST /applications (Bloqueo Vacante Cerrada)', false, `Status inesperado: ${res.status}`);
    }
  } catch (e) {
    log('3. POST /applications (Bloqueo Vacante Cerrada)', false, e.message);
  }

  // 4. GET /applications - Listado General (200)
  try {
    const res = await fetch(`${BASE_URL}/applications`);
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      log('4. GET /applications (Listado general - 200)', true, `Registros obtenidos: ${data.length}`);
    } else {
      log('4. GET /applications (Listado general)', false, `Status: ${res.status}`);
    }
  } catch (e) {
    log('4. GET /applications (Listado general)', false, e.message);
  }

  if (createdAppId) {
    // 5. PUT /applications/:id/status - Sin Autenticación (401)
    try {
      const res = await fetch(`${BASE_URL}/applications/${createdAppId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_REVIEW' })
      });
      const data = await res.json();
      if (res.status === 401) {
        log('5. PUT /applications/:id/status (Bloqueo Sin Token - 401)', true, data.error?.message);
      } else {
        log('5. PUT /applications/:id/status (Bloqueo Sin Token)', false, `Status inesperado: ${res.status}`);
      }
    } catch (e) {
      log('5. PUT /applications/:id/status (Bloqueo Sin Token)', false, e.message);
    }

    // 6. PUT /applications/:id/status - Con JWT (200 OK -> IN_REVIEW)
    try {
      const res = await fetch(`${BASE_URL}/applications/${createdAppId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'IN_REVIEW' })
      });
      const data = await res.json();
      if (res.status === 200 && data.status === 'IN_REVIEW') {
        log('6. PUT /applications/:id/status (Cambio a IN_REVIEW - 200)', true, `Estado actualizado: ${data.status}`);
      } else {
        log('6. PUT /applications/:id/status (Cambio a IN_REVIEW)', false, `Status: ${res.status}`);
      }
    } catch (e) {
      log('6. PUT /applications/:id/status (Cambio a IN_REVIEW)', false, e.message);
    }

    // 7. PUT /applications/:id/status - Transición a Estado Final (200 OK -> REJECTED)
    try {
      const res = await fetch(`${BASE_URL}/applications/${createdAppId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'REJECTED' })
      });
      const data = await res.json();
      if (res.status === 200 && data.status === 'REJECTED') {
        log('7. PUT /applications/:id/status (Transición a REJECTED - 200)', true, `Estado final: ${data.status}`);
      } else {
        log('7. PUT /applications/:id/status (Transición a REJECTED)', false, `Status: ${res.status}`);
      }
    } catch (e) {
      log('7. PUT /applications/:id/status (Transición a REJECTED)', false, e.message);
    }

    // 8. PUT /applications/:id/status - Inmutabilidad sobre REJECTED (400 Bad Request)
    try {
      const res = await fetch(`${BASE_URL}/applications/${createdAppId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'IN_REVIEW' })
      });
      const data = await res.json();
      if (res.status === 400) {
        log('8. PUT /applications/:id/status (Inmutabilidad de Estado Final - 400)', true, data.error?.message);
      } else {
        log('8. PUT /applications/:id/status (Inmutabilidad de Estado Final)', false, `Status inesperado: ${res.status}`);
      }
    } catch (e) {
      log('8. PUT /applications/:id/status (Inmutabilidad de Estado Final)', false, e.message);
    }
  }

  console.log('✨ Batería de pruebas de Endpoints finalizada.\n');
}

runTests();