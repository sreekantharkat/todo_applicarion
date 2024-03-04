const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite = require('sqlite3')
const dateFns = require('date-fns')
const {format, isValid} = dateFns

const app = express()
const middlewareFunction = express.json()
app.use(middlewareFunction)

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    })
    app.listen(3000, () => {
      console.log('http://localhost:3000/')
    })
  } catch (err) {
    console.log(`DB Error : ${err.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const validateStatus = (request, response, next) => {
  let {status} = request.query

  if (status === undefined) {
    status = request.body.status
  }
  if (status === undefined) {
    status = ''
  }

  const isValidStatus =
    status === 'TO DO' ||
    status === 'IN PROGRESS' ||
    status === 'DONE' ||
    status === ''

  if (isValidStatus) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
}

const validatePriority = (request, response, next) => {
  let {priority} = request.query

  if (priority === undefined) {
    priority = request.body.priority
  }
  if (priority === undefined) {
    priority = ''
  }

  const isValidPriority =
    priority === 'HIGH' ||
    priority === 'MEDIUM' ||
    priority === 'LOW' ||
    priority === ''

  if (isValidPriority) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
}

const validateCategory = (request, response, next) => {
  let {category} = request.query

  if (category === undefined) {
    category = request.body.category
  }
  if (category === undefined) {
    category = ''
  }

  const isValidCategory =
    category === 'WORK' ||
    category === 'HOME' ||
    category === 'LEARNING' ||
    category === ''

  if (isValidCategory) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Category')
  }
}

const validateDate = (request, response, next) => {
  let {date} = request.query

  if (date === undefined) {
    date = request.body.dueDate
  }

  const isDateValid = isValid(new Date(`${date}`))
  if (isDateValid) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
}

const convertQueryToResponse = todoReponse => {
  return todoReponse.map(eachItem => {
    const {id, todo, priority, status, category, due_date} = eachItem
    return {
      id,
      todo,
      priority,
      status,
      category,
      dueDate: due_date,
    }
  })
}

// API - 1

app.get(
  '/todos/',
  validateStatus,
  validatePriority,
  validateCategory,
  async (request, response) => {
    const {
      status = '',
      priority = '',
      search_q = '',
      category = '',
    } = request.query
    const todoQuery = `
    SELECT * FROM TODO WHERE 
    PRIORITY LIKE "%${priority}%" AND
    TODO LIKE "%${search_q}%" AND
    STATUS LIKE "%${status}%" AND
    CATEGORY LIKE "%${category}%";
    `
    const dbResponse = await db.all(todoQuery)
    const result = convertQueryToResponse(dbResponse)
    response.send(result)
  },
)

// API - 2

app.get(
  '/todos/:todoId/',
  validateStatus,
  validatePriority,
  validateCategory,
  async (request, response) => {
    const {todoId} = request.params
    const todoQuery = `
  SELECT * FROM TODO 
  WHERE ID = ${todoId};
  `
    const dbResponse = await db.get(todoQuery)
    response.send({
      id: dbResponse.id,
      todo: dbResponse.todo,
      priority: dbResponse.priority,
      status: dbResponse.status,
      category: dbResponse.category,
      dueDate: dbResponse.due_date,
    })
  },
)

// API - 3

app.get('/agenda/', validateDate, async (request, response) => {
  const {date} = request.query
  const agendaFormattedDate = format(new Date(date), 'yyyy-MM-dd')
  const dbQuery = `
  SELECT * FROM TODO WHERE DUE_DATE = "${agendaFormattedDate}";
  `
  const dbResponse = await db.get(dbQuery)
  response.send(convertQueryToResponse([dbResponse]))
})

// API - 4

app.post(
  '/todos/',
  validateStatus,
  validatePriority,
  validateCategory,
  validateDate,
  async (request, response) => {
    const {id, todo, priority, status, category, dueDate} = request.body
    const insertQuery = `
    INSERT INTO TODO(id, todo, priority, status, category, due_date)
    VALUES (
     ${id},
     "${todo}",
     "${priority}", 
     "${status}", 
    "${category}", 
     "${dueDate}"
     );
    `
    const dbResponse = await db.run(insertQuery)
    response.send('Todo Successfully Added')
  },
)

// API - 5

app.put(
  '/todos/:todoId/',
  validateStatus,
  validatePriority,
  validateCategory,
  async (request, response) => {
    const {todoId} = request.params
    const {status, priority, todo, category, dueDate} = request.body
    let dbUpdateQuery

    if (status !== undefined) {
      dbUpdateQuery = `
      UPDATE TODO
      SET STATUS = "${status}"
      WHERE ID = ${todoId};
      `
      const dbResponse = await db.run(dbUpdateQuery)
      response.send('Status Updated')
    }

    if (priority !== undefined) {
      dbUpdateQuery = `
      UPDATE TODO
      SET PRIORITY = "${priority}"
      WHERE ID = ${todoId};
      `
      const dbResponse = await db.run(dbUpdateQuery)
      response.send('Priority Updated')
    }

    if (todo !== undefined) {
      dbUpdateQuery = `
      UPDATE TODO
      SET TODO = "${todo}"
      WHERE ID = ${todoId};
      `
      const dbResponse = await db.run(dbUpdateQuery)
      response.send('Todo Updated')
    }

    if (category !== undefined) {
      dbUpdateQuery = `
      UPDATE TODO
      SET CATEGORY = "${category}"
      WHERE ID = ${todoId};
      `
      const dbResponse = await db.run(dbUpdateQuery)
      response.send('Category Updated')
    }

    if (dueDate !== undefined) {
      const isDateValid = isValid(new Date(`${dueDate}`))
      if (isDateValid) {
        dbUpdateQuery = `
        UPDATE TODO
        SET due_date = "${dueDate}"
        WHERE ID = ${todoId};
        `
        const dbResponse = await db.run(dbUpdateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    }
  },
)

// API - 7

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  DELETE FROM TODO 
  WHERE ID = ${todoId};
  `
  const dbResponse = await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
