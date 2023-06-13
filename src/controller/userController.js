const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const secretKey = 'Arjun_pandit';

//! user creation
const register = async (req, res) => {
  try{
    const db = req.con;
    const fieldAllowed=["username", "password", "fname", "lname", "mobile", "mobile", "email"]
          const data=req.body
          const keyOf=Object.keys(data)  
          const receivedKey=fieldAllowed.filter((x) => !keyOf.includes(x))
          if(receivedKey.length) return res.status(400).send({status: false, message: `${receivedKey} field key is missing`});
  
    const { username, password, fname, lname, mobile, email} = req.body;
    
    if(!username.trim()) return res.status(400).send({status:false, message: "User name Can'not be blank"});
    if(!(/^[A-Z a-z]{6,6}$/.test(username.trim()))) return res.status(400).send({status:false, message: "User Name should be in alphabet only, and max and min length is 6"});
  
    if(!password.trim()) return res.status(400).send({status:false, message: "Password is required"});
    if(!(/^\s*(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,15}\s*$/.test(password.trim()))) return res.status(400).send({status:false, message: "Pasword Should be in Alphanumeric and special character and length 8-15 digit only"});
    
    const hash=bcrypt.hashSync(data.password, 10);
    data.password=hash
  
    if(!fname.trim()) return res.status(400).send({status:false, message: "First Name is Can'not be blank"});
    if(!(/^[A-Z a-z]{1,29}$/.test(fname.trim()))) return res.status(400).send({status:false, message: "First Name should be in alphabet only"});
  
    if(!lname.trim()) return res.status(400).send({status:false, message: "Last Name is Can'not be blank"});
    if(!(/^[A-Z a-z]{1,29}$/.test(lname.trim()))) return res.status(400).send({status:false, message: "last Name should be in alphabet only"});
  
    if(!mobile.trim()) return res.status(400).send({ status: false, message: `Mobile cannot be blank` });
    if (!/^[6789]\d{9}$/.test(mobile)) return res.status(400).send({status: false,msg: `${mobile} is not a valid mobile number, Please enter 10 digit mobile number`});
  
    if(!email.trim()) return res.status(400).send({ status: false, message: `Email cannot be blank` });
    if (!(/^\s*[a-zA-Z][a-zA-Z0-9]*([-\.\_\+][a-zA-Z0-9]+)*\@[a-zA-Z]+(\.[a-zAZ]{2,5})+\s*$/.test(email))) return res.status(400).send({status: false,message: `${email} should be a valid email address`});

    //! check if username, email, phone is already exist

    const usernameQuery = "select count(*) as userCount from users where username=?";
    const mobileQuery = "select count(*) as mobileCount from users where mobile=?";
    const emailQuery = "select count(*) as emailCount from users where email=?";

    await db.query(usernameQuery, [username], (error, userResult) =>{
      if(error) return res.status(400).send({status:false, message: error.message});

      db.query(mobileQuery, [mobile], (error, mobileResult) =>{
        if(error) return res.status(400).send({status:false, message: error.message});

        db.query(emailQuery, [email], (error, emailResult) =>{
          if(error) return res.status(400).send({status:false, message: error.message});
          
        const userCount = userResult[0].userCount;
        const mobileCount = mobileResult[0].mobileCount;
        const emailCount = emailResult[0].emailCount;

        if(userCount > 0) return res.status(400).send({status:false, message: `This ${username} already exist.`});
        if(mobileCount > 0) return res.status(400).send({status:false, message: `This ${mobile} already exist.`});
        if(emailCount > 0) return res.status(400).send({status:false, message: `This ${email} already exist.`});

        db.query(`INSERT INTO users (username, password, fname, lname, mobile, email) VALUES (?, ?, ?, ?, ?, ?)`,
          [username, data.password, fname, lname, mobile, email], (error) =>{
            if(error) return res.status(400).send({status:false, message: error.message});
            const { password, ...responseData } = data;
            return res.status(200).send({status:true, message: " User Registered Successfully", data: responseData});
          }
        );
        });        
      });      
    });
  }catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
  };


//! User Login

const login = async (req, res) => {
  try {
    const db = req.con;
    const fieldAllowed = ["username", "password"];
    const data = req.body;
    const keyOf = Object.keys(data);
    const receivedKey = fieldAllowed.filter((x) => !keyOf.includes(x));
    if (receivedKey.length) return res.status(400).send({status: false, message: `${receivedKey} field key is missing`});
    
    const { username, password } = req.body;
    if (!username.trim()) return res.status(400).send({status: false, message: "User name cannot be blank"});
    
    if (!password.trim()) return res.status(400).send({status: false, message: "Password cannot be blank"});

    await db.query("select * from users where username=?", [username], async (error, result) => {
      if (error) return res.status(400).send({status: false, message: error.message});

      if (result.length > 0) {
        const user = result[0];

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
          res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // Set the token as an HTTP-only cookie
          return res.status(200).send({status: true, token });
        } else {
          return res.status(401).send({status: false, message: "Invalid Password"});
        }
      } else {
        return res.status(401).send({status: false, message: "Invalid Username"});
      }
    });
  } catch (error) {
    return res.status(500).send({status: false, message: error.message,});
  }
};


//! User Logout

const logout = (req, res) => {
  try {

    if (!req.cookies.token) return res.status(401).send({status: false, message: "You are not logged in"});

    res.clearCookie("token").send({status: true, message: "Logged out successfully"});

  } catch (error) {
    return res.status(500).send({status: false, message: error.message});
  }
};


//! User all users

const getAllUsers = async (req, res) => {
  try {
    
    const db = req.con;
    await db.query("select * from users", (error, result) =>{
      if (error) return res.status(400).send({status: false, message: "Data not Found"});
      const user = result[0];
      delete user.password;
      return res.status(200).send({status: true, count: result.length, data: user});
    });
    
  } catch (error) {
    return res.status(500).send({status: false, message: error.message});
  }
};


//! User get by username

const getUserByUsername = async (req, res) => {
  try {
    const db = req.con;
    const {username} = req.body;
    if (!username) return res.status(400).send({ status: false, message: "Please provide username" });

    await db.query("select * from users where username = ?", [username], (error, result) => {
      if (error) return res.status(400).send({status: false, message: error.message});
  
      if (result.length === 0) return res.status(404).send({status: false, message: "User not found"});
      
      const user = result[0];
      delete user.password;
      return res.status(200).send({status: true, data: user});
    });

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//! User update

const updateUser = async (req, res) => {
  try {
    const db = req.con;
    const { username } = req.body;
    if (!username) return res.status(400).send({ status: false, message: "Please provide username" });

    if (!req.cookies.token) return res.status(401).send({ status: false, message: "You are not logged in" });

    const { password, fname, lname, mobile, email } = req.body;

    await db.query("select username from users where username=?", [username], (error, result) =>{
      if(error) return res.status(400).send({status: false, message: error.message})
      if(result.length === 0) return res.status(404).send({status: false, message: "User Not Found"});
    });

    //!check existing and duplicacy

      await db.query(`SELECT COUNT(username) AS existsCount, IF(mobile = ?, 'Mobile', IF(email = ?, 'Email', 'Unknown')) AS field FROM users WHERE username <> ? AND (mobile = ? OR email = ?)`,
        [mobile, email, username, mobile, email], (error, result) => {
          if(error) return res.status(400).send({status: false, message: error.message});

          if(!password.trim()) return res.status(400).send({status:false, message: "Password is required"});
          if(!(/^\s*(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,15}\s*$/.test(password.trim()))) return res.status(400).send({status:false, message: "Pasword Should be in Alphanumeric and special character and length 8-15 digit only"});

          if(!mobile.trim()) return res.status(400).send({ status: false, message: `Mobile cannot be blank` });
          if(!/^[6789]\d{9}$/.test(mobile)) return res.status(400).send({status: false, msg: `${mobile} is not a valid mobile number, Please enter 10 digit mobile number`});

          if(!email.trim()) return res.status(400).send({ status: false, message: `Email cannot be blank` });
          if(!(/^\s*[a-zA-Z][a-zA-Z0-9]*([-\.\_\+][a-zA-Z0-9]+)*\@[a-zA-Z]+(\.[a-zAZ]{2,5})+\s*$/.test(email))) return res.status(400).send({status: false,message: `${email} should be a valid email address`});

          if(result[0].existsCount === 0){
            const hash = bcrypt.hashSync(password, 10)

            db.query("update users set password=?, fname=?, lname=?, mobile=?, email=? where username=?", [hash, fname, lname, mobile, email, username], (error, result) =>{
                  if(error) return res.status(400).send({status: false, message: error.message});

                  return res.status(200).send({status: true, message: "User Updated Successfully"})
                })
          } else {
            const existingField = result[0].field;
            return res.status(400).send({status: true, message: `${existingField} Already Exist`})
          }  
        }
      );
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const db = req.con;
    
    if (!req.cookies.token) return res.status(401).send({ status: false, message: "You are not logged in" });

    const {username} = req.body;
    if (!username) return res.status(400).send({ status: false, message: "Please provide username" });

    await db.query("select * from users where username = ?", [username], (error, result) => {
      if (error) return res.status(400).send({status: false, message: error.message});
  
      if (result.length === 0) return res.status(404).send({status: false, message: "User not found"});
      
      db.query("delete from users where username = ?", [username], (error, result) =>{
        if (error) return res.status(400).send({status: false, message: error.message});

        return res.status(200).send({status: true, message: "User Deleted Successfully"})
      })
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports= {register, login, logout, getAllUsers, getUserByUsername, updateUser, deleteUser}