require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const Person = require('./models/person')

app.use(cors());
app.use(express.json());
app.use(express.static('dist'))
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    JSON.stringify(req.body)
  ].join(' ')
}));

app.get('/info', async (request, response) => {
  response.send(`<div>Phonebook has info for ${await Person.countDocuments({})} people <br></br> ${new Date()}</div>`);
});

app.get('/api/persons/:id', (request, response, next) => {

  Person.findById(request.params.id)
  .then(person => {
    if (person) {
      response.json(person);
    } else {
      response.status(404).end();
    }
  })
  .catch(error => next(error));
});

app.delete('/api/persons/:id', (request, response, next) => {

  console.log(request.params.id);

  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error));
});

app.post('/api/persons', async (request, response, next) => {

  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'name or number missing' });
  };

  /*if (Person.findOne({ name: body.name })){
    return response.status(409).json({ 
      error: 'name must be unique'
    });
  }*/

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  try {
    const savedPerson = await person.save();
    response.json(savedPerson);
  } catch (error) {
    error => next(error);
  }
});

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body;

  const person = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson);
    })
    .catch(error => next(error));
});

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then(persons => {
    response.json(persons);
  })
  .catch(error => next(error));
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError'){
    return response.status(400).json({ error: error.message })
  }

  next(error);
}

app.use(errorHandler);