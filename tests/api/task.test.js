const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index'); 

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/tasks', () => {
  it('should create a new task and return it', async () => {
    const newTask = {
      title: 'Test Task',
      description: 'Testing POST endpoint',
    };

    const response = await request(app)
      .post('/api/tasks')
      .send(newTask);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe(newTask.title);
    expect(response.body.description).toBe(newTask.description);
  });
});

describe('GET /api/tasks', () => {
  it('should return all tasks', async () => {
    // Create two sample tasks first
    await request(app).post('/api/tasks').send({ title: 'Task 1', description: 'First' });
    await request(app).post('/api/tasks').send({ title: 'Task 2', description: 'Second' });

    // Now test the GET request
    const res = await request(app).get('/api/tasks');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('description');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('should update a task and return the updated data', async () => {
    // First create a task
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Old Title',
      description: 'Old Description',
    });

    const taskId = createRes.body._id;

    // Now update it
    const updateRes = await request(app).put(`/api/tasks/${taskId}`).send({
      title: 'New Title',
      description: 'Updated Description',
    });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.title).toBe('New Title');
    expect(updateRes.body.description).toBe('Updated Description');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('should delete a task and return a success message', async () => {
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Task to Delete',
      description: 'Delete this one',
    });

    const taskId = createRes.body._id;

    const deleteRes = await request(app).delete(`/api/tasks/${taskId}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty('message', 'Task deleted successfully');
  });
});
