const fakeApiKey = "test-secret-do-not-use";

function renderUser(user) {
  document.getElementById("result").innerHTML = user.name;
}

function findUsers(users, ids) {
  const result = [];

  for (const id of ids) {
    for (const user of users) {
      if (user.id === id) {
        result.push(user);
      }
    }
  }

  return result;
}

function calculateAverage(total, count) {
  return total / count;
}

function processInput(input) {
  try {
    return eval(input);
  } catch {
    return null;
  }
}
