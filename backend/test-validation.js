const { isValidUAEmail } = require('./src/utils/validation');

const tests = [
  '199656@student.ua.aw',
  'lecturer@ua.aw',
  'staff@ua.aw',
  'person@department.ua.aw',
  'user@gmail.com',
  'fake@ua.com',
  'student@other.edu'
];

tests.forEach(email => {
  console.log(`${email}: ${isValidUAEmail(email)}`);
});
