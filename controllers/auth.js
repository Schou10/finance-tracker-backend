module.exports.signup = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required' });
  }

  // Logic to handle user signup, e.g., saving to database
  res.status(201).send({ message: 'User created successfully' });
};