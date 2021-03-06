const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const app = require('../app')
const Blog = require('../models/Blog')
const User = require('../models/User')
const helper = require('./test_helper')

const api = supertest(app)
let token = null

beforeEach(async () => {

    // initialize a user
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash: passwordHash })

    await user.save()

    const userForToken = {
        username: user.username,
        id: user._id
    }

    token = jwt.sign(userForToken, process.env.SECRET)

    //initialize Blogs
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
        .map(blog => new Blog({ ...blog, user: user._id}))

    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

describe('when there is initially some blogs saved', () => {
    test('blog are returned as json', async () => {
        await api
            .get('/api/bloglist')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('blog list returns the correct amount of blogs', async () => {
        const response = await api.get('/api/bloglist')

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

})

describe('viewing a specific blog', () => {
    test('id property is named correctly', async () => {
        const response = await api.get('/api/bloglist')

        const blog = response.body[0]

        expect(blog.id).toBeDefined()
    })

})

describe('addition of a new blog', () => {
    test('adding a blog returns 401 status code if token is not provided', async () => {
        const newBlog = {
            "title": "some new blog",
            "author": "the new master",
            "url": "newmasterblog.com",
            "likes": "8999"
        }

        await api.post('/api/bloglist')
            .send(newBlog)
            .expect(401)
    })

    test('a valid blog can be added', async () => {
        const newBlog = {
            "title": "some new blog",
            "author": "the new master",
            "url": "newmasterblog.com",
            "likes": "8999"
        }

        await api.post('/api/bloglist')
            .send(newBlog)
            .set('authorization', `bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const titles = blogsAtEnd.map(blog => blog.title)
        expect(titles).toContain('some new blog')

    })

    test('default value of likes is 0', async () => {
        const newBlog = {
            "title": "some new blog",
            "author": "the new master",
            "url": "newmasterblog.com"
        }

        await api.post('/api/bloglist')
            .send(newBlog)
            .set('authorization', `bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        const addedBlog = blogsAtEnd.find(blog => blog.title == newBlog.title)

        expect(addedBlog.likes).toEqual(0)
    })

    test('title and url missing from blog returns bad request', async () => {
        const missingPropBlog = {
            "author": "the new master"
        }

        await api.post('/api/bloglist')
            .send(missingPropBlog)
            .set('authorization', `bearer ${token}`)
            .expect(400)

    })
})

describe('deletion of a blog', () => {
    test('succeeds with status 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api.delete(`/api/bloglist/${blogToDelete.id}`)
            .set('authorization', `bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(
            helper.initialBlogs.length - 1
        )

        const titles = blogsAtEnd.map(blog => blog.title)

        expect(titles).not.toContain(blogToDelete.title)
    })
})

describe('updating a blog', () => {
    test('succeeds with updated blog', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = { ...blogsAtStart[0] }

        blogToUpdate.likes += 1

        await api.put(`/api/bloglist/${blogToUpdate.id}`)
            .send(blogToUpdate)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()

        const updatedBlogs = blogsAtEnd.find(
            blog => blog.id == blogToUpdate.id
        )

        expect(updatedBlogs.likes).toEqual(blogsAtStart[0].likes + 1)

    })
})

afterAll(() => {
    mongoose.connection.close()
})