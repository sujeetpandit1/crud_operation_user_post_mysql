const express = require('express');
const { register, login, logout, getAllUsers, updateUser, deleteUser, getUserByUsername } = require('../controller/userController');
const { createBlog, getBlogs, getBlogByQuery, updateBlog, deleteBlog } = require('../controller/blogController');
const router = express.Router();


/------------User Routes--------------------/
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/allUsers', getAllUsers);
router.get('/getUserByUsername', getUserByUsername);
router.put('/updateUser', updateUser);
router.delete('/deleteUser', deleteUser);


/------------Blog Routes--------------------/
router.post('/createBlog', createBlog);
router.get('/getAllBlogs', getBlogs);
router.get('/getBlogByQuery', getBlogByQuery);
router.put('/updateBlog', updateBlog);
router.delete('/deleteBlog', deleteBlog)



module.exports=router;