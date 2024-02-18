const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('http://localhost:3000/')
    })
  } catch (err) {
    console.log(`DB Error : ${err.msg}`)
    process.exit(1)
  }
}

initializeDBandServer()

app.get('/todos/', async (request, response) => {
  const {status = '', priority = '', search_q = ''} = request.query
  const todo_query = `
  SELECT * FROM Todo_List
  WHERE status LIKE "%${status}%" and
  priority LIKE "%${priority}%" and
  todo LIKE "%${search_q}%";
  `
  const result = await db.all(todo_query)
  response.send(result)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoQuery = `
  select * from todo_list
  where id = ${todoId};
  `
  const result = await db.get(todoQuery)
  response.send(result)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postQuery = `
  INSERT INTO 
  TODO_LIST (id, todo, priority, status) 
  VALUES (${id}, "${todo}", "${priority}", "${status}");
  `
  const result = await db.run(postQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status = '', priority = '', todo = ''} = request.body
  if (status !== '') {
    const statusUpdateQuery = `
    UPDATE Todo_List
    SET status = "${status}"
    WHERE id = ${todoId};
    `

    const result = await db.run(statusUpdateQuery)
    response.send('Status Updated')
  } else if (priority !== '') {
    const statusUpdateQuery = `
    UPDATE Todo_List
    SET priority = "${priority}"
    WHERE id = ${todoId};
    `

    const result = await db.run(statusUpdateQuery)
    response.send('Priority Updated')
  } else if (todo !== '') {
    const statusUpdateQuery = `
    UPDATE Todo_List
    SET todo = "${todo}"
    WHERE id = ${todoId};
    `
    const result = await db.run(statusUpdateQuery)
    response.send('Todo Updated')
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  DELETE FROM Todo_List WHERE id = ${todoId};
  `

  const result = await db.run(deleteQuery)
  response.send('Todo Updated')
})

module.exports = app
