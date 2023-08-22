const user = require('../models/user');

exports.createUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const foundUser = await user.findOne({ where: { username: username } });
    if (foundUser) {
      res.status(200).json({ message: 'This user is in DataBase', userId: foundUser.id });
    } else {
    const newUser = await user.create({ username: username, password: password });
    res.status(200).json({ message: 'One record has been added into users', userId: newUser.id});
  } }catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add the record into user' });
  }
};


exports.loginUser = async (req, res) => {
  const { username, password } = req.params;

  try {
    const foundUser = await user.findOne({ where: { username: username, password: password } });
    if (foundUser) {
      res.status(200).json({ message: 'This user is in DataBase', userId: foundUser.id });
    } else {
      res.status(200).json({ message: 'No records found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error occurred during login' });
  }
};

exports.updateDetails = async (req, res) => {
  const { username, password } = req.body;
  const { id } = req.params;

  try {
   
      const foundUser = await user.findOne({ where: { username: username } });
      if (foundUser && foundUser.id!=id) {
        res.status(200).json({ message: 'This user is in DataBase', userId: foundUser.id });
      } else {
        const [updatedRowsCount, updatedUsers] = await user.update(
          { username: username, password: password },
          { where: { id: id }, returning: true }
        );
    
    

      if (updatedRowsCount > 0) {
        const updatedUser = updatedUsers[0];
        res.status(200).json({
          message: 'UserDetails Updated Successfully',
          username: updatedUser.username,
          password: updatedUser.password
        });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    
  }} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update the details' });
  }
};

