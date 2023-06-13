
//! Create Blog
const createBlog = async (req, res) => {
    try {
        const db = req.con;
        const { username } = req.body;
        if (!username) return res.status(400).send({ status: false, message: "Please provide username" });

        if (!req.cookies.token) return res.status(401).send({ status: false, message: "You are not logged in" });

        //! Check User Name

        await db.query("select username from users where username=?", [username], (error, result) =>{
            if(error) return res.status(400).send({status: false, message: error.message})
            if(result.length === 0) return res.status(404).send({status: false, message: "User Not Found"});
          
        
        const fieldAllowed=["title", "content"]
        const data=req.body
        const keyOf=Object.keys(data)  
        const receivedKey=fieldAllowed.filter((x) => !keyOf.includes(x))
        if(receivedKey.length) return res.status(400).send({status: false, message: `${receivedKey} field key is missing`});
  
        const { title, content } = req.body;

        if (!title.trim()) return res.status(400).send({ status: false, message: "Title cannot be blank" });
        
        const checkTitle = "select count(*) as titleCount from blogs where title=? and username=?";
        
        db.query(checkTitle, [title, username], (error, result) =>{
            if (error) return res.status(400).send({ status: false, message: error.message });
       
            if(result[0].titleCount !== 0) return res.status(400).send({status: false, message: `Title >> ${title}' << already exists.`});
            if (!content.trim()) return res.status(400).send({ status: false, message: "Content cannot be blank" });
         
            //! Generate unique ID
            const blogId = Math.floor(1000 + Math.random() * 9000);
            db.query(`INSERT INTO blogs (uuid, title, content, username) VALUES (?,?,?,?)`, [blogId, title, content, username], (error) => {
                if (error) return res.status(400).send({ status: false, message: error.message });
    
                return res.status(200).send({ status: true, message: "Blog Created Successfully", data: data });
            });
        });
    });
        
    } catch (error) {
        return res.status(500).send({status: false, message: error.message});
    }
};

//! Get all Blogs
const getBlogs = async (req, res) => {
    try {

        const db = req.con;
        await db.query("select * from blogs", (error, result) =>{
          if (error) return res.status(400).send({status: false, message: "Data not Found"});
          return res.status(200).send({status: true, count: result.length, data: result});
        });
        
    } catch (error) {
        return res.status(500).send({status: false, message: error.message});
    }
};

//! get blog by Query
const getBlogByQuery = async (req, res) => {
    try {
      const db = req.con;
      const { title } = req.body.query;
      // if (!title.query) return res.status(400).send({ status: false, message: "Please provide query" });

      // const {title} = query;
      // if (!title) return res.status(400).send({ status: false, message: "Please provide title keyword to search" });

      // const query = "SELECT * FROM blogs WHERE title LIKE ?";
      // const searchValue = '%' + title + '%';
      db.query("SELECT * FROM blogs WHERE title LIKE ?", ['%' + title + '%'], (error, result) => {
        if (error) return res.status(400).send({ status: false, message: "Data not found" });

        if (result.length === 0) {
          return res.status(200).send({ status: false, count: 0, message: "No matching blogs found" });
        }
        return res.status(200).send({ status: true, count: result.length, data: result });
      });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
};

//! update blog

const updateBlog = async (req, res) => {
  try {
    const db = req.con;

    if (!req.cookies.token) return res.status(401).send({ status: false, message: "You are not logged in" });

    const { uuid, username, title, content } = req.body;
    
    if (!uuid || !username) return res.status(400).send({ status: false, message: "Please provide uuid and username" });

    if (!title) return res.status(400).send({ status: false, message: "Title cannot be blank" });
    if (!content) return res.status(400).send({ status: false, message: "Content cannot be blank" });
    
    await db.query("SELECT uuid FROM blogs WHERE uuid=? AND username=?", [uuid, username], (error, result) => {
      if (error) return res.status(400).send({ status: false, message: error.message });
      
      if (result.length === 0) return res.status(400).send({ status: false, message: "Data not found" });

      db.query("SELECT COUNT(*) AS existCount FROM blogs WHERE uuid<>? AND title=?", [uuid, title], (error, result) => {
        if (error) return res.status(400).send({ status: false, message: error.message });

        if (result[0].existCount === 0) {
          db.query("UPDATE blogs SET title=?, content=? WHERE username=? AND uuid=?", [title, content, username, uuid], (error, result) => {
            if (error) return res.status(400).send({ status: false, message: error.message });

            return res.status(200).send({ status: true, message: "Blog Updated Successfully" });
          });
        } else {
          return res.status(400).send({ status: false, message: `${title} Already Exists` });
        }
      });
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const db = req.con;

    if (!req.cookies.token) return res.status(401).send({ status: false, message: "You are not logged in" });

    const {uuid, username} = req.body;
    if (!uuid, !username) return res.status(400).send({ status: false, message: "Please provide uuid and username" });

    await db.query("select * from blogs where uuid = ? and username=?", [uuid, username], (error, result) => {
      if (error) return res.status(400).send({status: false, message: error.message});
  
      if (result.length === 0) return res.status(404).send({status: false, message: "Blog not found"});
      
      db.query("delete from blogs where uuid = ? and username=?", [uuid, username], (error) =>{
        if (error) return res.status(400).send({status: false, message: error.message});

        return res.status(200).send({status: true, message: "Blog Deleted Successfully"})
      })
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

  

module.exports={createBlog, getBlogs, getBlogByQuery, updateBlog, deleteBlog}