const userList = ["JPY", "HKD", "USD"];

const isPermittedUser = (username) => {
    return userList.includes(username)
}

module.exports = { isPermittedUser };
