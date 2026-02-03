const users = [];
const loginEvents = [];

function addUser(user) {
  users.push(user);
}

function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function logLogin(event) {
  loginEvents.push(event);
}

module.exports = {
  users,
  loginEvents,
  addUser,
  findUserByEmail,
  logLogin,
};
